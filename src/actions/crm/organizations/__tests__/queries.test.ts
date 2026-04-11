import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getOrganizations, getOrganizationById, getActiveOrganizations } from '../queries';
import { testIds, mockSessions, createOrganizationResponse } from '@/lib/testing';
import type { OrganizationPagination } from '@/features/crm/organizations/types';

const { mockOrgRepo, mockAuth } = vi.hoisted(() => ({
  mockOrgRepo: {
    searchOrganizations: vi.fn(),
    findOrganizationById: vi.fn(),
    findActiveOrganizations: vi.fn(),
  },
  mockAuth: vi.fn(),
}));

vi.mock('@/repositories/organization-repository', () => ({
  OrganizationRepository: vi.fn().mockImplementation(function () {
    return mockOrgRepo;
  }),
}));

vi.mock('@/auth', () => ({ auth: mockAuth }));

vi.mock('@/filters/organizations/organizations-filters', () => ({
  searchParamsCache: {
    parse: vi.fn().mockReturnValue({ page: 1, perPage: 10 }),
  },
  validateOrganizationSearchParams: vi.fn().mockImplementation((p) => p),
}));

const TEST_ORG_ID = testIds.organization();
const mockOrg = createOrganizationResponse({ id: TEST_ORG_ID });

const mockPagination: OrganizationPagination = {
  items: [mockOrg],
  pagination: {
    totalItems: 1,
    totalPages: 1,
    currentPage: 1,
    hasNextPage: false,
    hasPreviousPage: false,
    nextPage: null,
    previousPage: null,
  },
};

describe('Organisation Queries', () => {
  const mockSession = mockSessions.manager();

  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue(mockSession);
  });

  describe('getOrganizations', () => {
    it('returns paginated organisations', async () => {
      mockOrgRepo.searchOrganizations.mockResolvedValue(mockPagination);

      const result = await getOrganizations({});

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.items).toHaveLength(1);
        expect(result.data.items[0].id).toBe(TEST_ORG_ID);
      }
      expect(mockOrgRepo.searchOrganizations).toHaveBeenCalledWith(
        expect.objectContaining({ page: 1, perPage: 10 }),
        mockSession.user.tenantId,
      );
    });

    it('returns unauthorized when not signed in', async () => {
      mockAuth.mockResolvedValue(null);

      const result = await getOrganizations({});

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toMatch(/signed in/i);
      }
    });
  });

  describe('getOrganizationById', () => {
    it('returns an organisation when found', async () => {
      mockOrgRepo.findOrganizationById.mockResolvedValue(mockOrg);

      const result = await getOrganizationById(TEST_ORG_ID);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe(TEST_ORG_ID);
        expect(result.data.customersCount).toBe(0);
      }
      expect(mockOrgRepo.findOrganizationById).toHaveBeenCalledWith(
        TEST_ORG_ID,
        mockSession.user.tenantId,
      );
    });

    it('returns error when organisation not found', async () => {
      mockOrgRepo.findOrganizationById.mockResolvedValue(null);

      const result = await getOrganizationById(TEST_ORG_ID);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toMatch(/not found/i);
      }
    });
  });

  describe('getActiveOrganizations', () => {
    it('returns all active organisations', async () => {
      mockOrgRepo.findActiveOrganizations.mockResolvedValue([mockOrg]);

      const result = await getActiveOrganizations();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(1);
        expect(result.data[0].name).toBe('Acme Florals');
      }
      expect(mockOrgRepo.findActiveOrganizations).toHaveBeenCalledWith(mockSession.user.tenantId);
    });
  });
});
