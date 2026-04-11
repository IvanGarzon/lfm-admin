import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getVendors, getVendorById, getVendorStatistics, getActiveVendors } from '../queries';
import {
  testIds,
  mockSessions,
  createVendorWithDetails,
  createVendorStatistics,
} from '@/lib/testing';

const { mockVendorRepo, mockAuth } = vi.hoisted(() => ({
  mockVendorRepo: {
    searchAndPaginate: vi.fn(),
    findByIdWithDetails: vi.fn(),
    getStatistics: vi.fn(),
    getActiveVendors: vi.fn(),
  },
  mockAuth: vi.fn(),
}));

vi.mock('@/repositories/vendor-repository', () => ({
  VendorRepository: vi.fn().mockImplementation(function () {
    return mockVendorRepo;
  }),
}));

vi.mock('@/auth', () => ({
  auth: mockAuth,
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {},
}));

vi.mock('@/filters/vendors/vendors-filters', () => ({
  searchParamsCache: {
    parse: vi.fn().mockReturnValue({ page: 1, perPage: 20 }),
  },
}));

const TEST_VENDOR_ID = testIds.vendor();
const unauthorizedError = 'You must be signed in to perform this action';

describe('Vendor Queries', () => {
  const mockSession = mockSessions.manager();

  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue(mockSession);
  });

  describe('getVendors', () => {
    it('returns paginated vendors successfully when authorised', async () => {
      const mockResult = {
        items: [createVendorWithDetails({ id: 'v1' }), createVendorWithDetails({ id: 'v2' })],
        pagination: { page: 1, perPage: 20, totalItems: 2, totalPages: 1 },
      };
      mockVendorRepo.searchAndPaginate.mockResolvedValue(mockResult);

      const result = await getVendors({});

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(mockResult);
      }
      expect(mockVendorRepo.searchAndPaginate).toHaveBeenCalled();
    });

    it('returns unauthorized when no session', async () => {
      mockAuth.mockResolvedValue(null);
      const result = await getVendors({});
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe(unauthorizedError);
      }
    });
  });

  describe('getVendorById', () => {
    it('returns vendor details successfully when authorised', async () => {
      const mockVendor = createVendorWithDetails({ id: TEST_VENDOR_ID });
      mockVendorRepo.findByIdWithDetails.mockResolvedValue(mockVendor);

      const result = await getVendorById(TEST_VENDOR_ID);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe(TEST_VENDOR_ID);
      }
    });

    it('returns error when vendor not found', async () => {
      mockVendorRepo.findByIdWithDetails.mockResolvedValue(null);

      const result = await getVendorById('non-existent');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Vendor not found');
      }
    });

    it('returns unauthorized when no session', async () => {
      mockAuth.mockResolvedValue(null);
      const result = await getVendorById(TEST_VENDOR_ID);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe(unauthorizedError);
      }
    });
  });

  describe('getVendorStatistics', () => {
    it('returns statistics successfully when authorised', async () => {
      const mockStats = createVendorStatistics();
      mockVendorRepo.getStatistics.mockResolvedValue(mockStats);

      const result = await getVendorStatistics();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.total).toBe(50);
        expect(result.data.active).toBe(40);
      }
      expect(mockVendorRepo.getStatistics).toHaveBeenCalledWith(mockSession.user.tenantId);
    });

    it('returns unauthorized when no session', async () => {
      mockAuth.mockResolvedValue(null);
      const result = await getVendorStatistics();
      expect(result.success).toBe(false);
    });
  });

  describe('getActiveVendors', () => {
    it('returns active vendors successfully when authorised', async () => {
      const mockVendors = [
        { id: 'v1', vendorCode: 'VEN-2026-0001', name: 'Acme' },
        { id: 'v2', vendorCode: 'VEN-2026-0002', name: 'Beta' },
      ];
      mockVendorRepo.getActiveVendors.mockResolvedValue(mockVendors);

      const result = await getActiveVendors();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(2);
      }
      expect(mockVendorRepo.getActiveVendors).toHaveBeenCalledWith(mockSession.user.tenantId);
    });

    it('returns unauthorized when no session', async () => {
      mockAuth.mockResolvedValue(null);
      const result = await getActiveVendors();
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe(unauthorizedError);
      }
    });
  });
});

describe('Vendor Queries - Permission Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockVendorRepo.searchAndPaginate.mockResolvedValue({ items: [], pagination: {} });
  });

  it('allows USER role to read vendors', async () => {
    mockAuth.mockResolvedValue(mockSessions.user());
    const result = await getVendors({});
    expect(result.success).toBe(true);
  });

  it('allows MANAGER role to read vendors', async () => {
    mockAuth.mockResolvedValue(mockSessions.manager());
    const result = await getVendors({});
    expect(result.success).toBe(true);
  });

  it('allows ADMIN role to read vendors', async () => {
    mockAuth.mockResolvedValue(mockSessions.admin());
    const result = await getVendors({});
    expect(result.success).toBe(true);
  });

  it('denies unauthenticated users', async () => {
    mockAuth.mockResolvedValue(null);
    const result = await getVendors({});
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('You must be signed in to perform this action');
    }
  });
});
