import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createOrganization, updateOrganization, deleteOrganization } from '../mutations';
import {
  testIds,
  mockSessions,
  createOrganizationInput,
  createOrganizationResponse,
} from '@/lib/testing';
import { revalidatePath } from 'next/cache';
import type { UpdateOrganizationInput } from '@/schemas/organizations';

const { mockOrgRepo, mockAuth } = vi.hoisted(() => ({
  mockOrgRepo: {
    createOrganization: vi.fn(),
    findOrganizationById: vi.fn(),
    updateOrganization: vi.fn(),
    deleteOrganization: vi.fn(),
  },
  mockAuth: vi.fn(),
}));

vi.mock('@/repositories/organization-repository', () => ({
  OrganizationRepository: vi.fn().mockImplementation(function () {
    return mockOrgRepo;
  }),
}));

vi.mock('@/auth', () => ({ auth: mockAuth }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));

const TEST_ORG_ID = testIds.organization();

const createInput = createOrganizationInput;
const mockOrg = createOrganizationResponse({ id: TEST_ORG_ID });

describe('Organisation Mutations', () => {
  const mockSession = mockSessions.manager();

  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue(mockSession);
  });

  describe('createOrganization', () => {
    it('creates an organisation and returns ID and name', async () => {
      mockOrgRepo.createOrganization.mockResolvedValue({ id: TEST_ORG_ID, name: 'Acme Florals' });

      const result = await createOrganization(createInput);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe(TEST_ORG_ID);
        expect(result.data.name).toBe('Acme Florals');
      }
      expect(mockOrgRepo.createOrganization).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Acme Florals' }),
        mockSession.user.tenantId,
      );
      expect(revalidatePath).toHaveBeenCalledWith('/customers');
      expect(revalidatePath).toHaveBeenCalledWith('/organizations');
    });

    it('returns unauthorized when not signed in', async () => {
      mockAuth.mockResolvedValue(null);

      const result = await createOrganization(createInput);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toMatch(/signed in/i);
      }
    });
  });

  describe('updateOrganization', () => {
    const updateInput: UpdateOrganizationInput = { ...createInput, id: TEST_ORG_ID };

    it('updates an organisation and returns the ID', async () => {
      mockOrgRepo.findOrganizationById.mockResolvedValue(mockOrg);
      mockOrgRepo.updateOrganization.mockResolvedValue(mockOrg);

      const result = await updateOrganization(updateInput);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe(TEST_ORG_ID);
      }
      expect(revalidatePath).toHaveBeenCalledWith('/customers');
      expect(revalidatePath).toHaveBeenCalledWith('/organizations');
    });

    it('returns error when organisation does not exist', async () => {
      mockOrgRepo.findOrganizationById.mockResolvedValue(null);

      const result = await updateOrganization(updateInput);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toMatch(/not found/i);
      }
      expect(mockOrgRepo.updateOrganization).not.toHaveBeenCalled();
    });

    it('returns error when update returns null', async () => {
      mockOrgRepo.findOrganizationById.mockResolvedValue(mockOrg);
      mockOrgRepo.updateOrganization.mockResolvedValue(null);

      const result = await updateOrganization(updateInput);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toMatch(/failed to update/i);
      }
    });
  });

  describe('deleteOrganization', () => {
    it('deletes an organisation and returns the ID', async () => {
      mockOrgRepo.findOrganizationById.mockResolvedValue(mockOrg);
      mockOrgRepo.deleteOrganization.mockResolvedValue({ id: TEST_ORG_ID });

      const result = await deleteOrganization({ id: TEST_ORG_ID });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe(TEST_ORG_ID);
      }
      expect(mockOrgRepo.deleteOrganization).toHaveBeenCalledWith(
        TEST_ORG_ID,
        mockSession.user.tenantId,
      );
    });

    it('returns error when organisation does not exist', async () => {
      mockOrgRepo.findOrganizationById.mockResolvedValue(null);

      const result = await deleteOrganization({ id: TEST_ORG_ID });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toMatch(/not found/i);
      }
      expect(mockOrgRepo.deleteOrganization).not.toHaveBeenCalled();
    });
  });
});
