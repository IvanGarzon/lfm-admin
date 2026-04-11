import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createVendor, updateVendor, updateVendorStatus, deleteVendor } from '../mutations';
import { testIds, mockSessions, createVendorInput, createVendorWithDetails } from '@/lib/testing';

const { mockVendorRepo, mockAuth } = vi.hoisted(() => ({
  mockVendorRepo: {
    createVendor: vi.fn(),
    updateVendor: vi.fn(),
    updateVendorStatus: vi.fn(),
    softDeleteVendor: vi.fn(),
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

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

const TEST_VENDOR_ID = testIds.vendor();
const unauthorizedError = 'You must be signed in to perform this action';

describe('Vendor Mutations', () => {
  const mockSession = mockSessions.manager();

  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue(mockSession);
  });

  describe('createVendor', () => {
    it('creates a vendor successfully when authorised', async () => {
      const input = createVendorInput();
      mockVendorRepo.createVendor.mockResolvedValue({
        id: TEST_VENDOR_ID,
        vendorCode: 'VEN-2026-0001',
      });

      const result = await createVendor(input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe(TEST_VENDOR_ID);
        expect(result.data.vendorCode).toBe('VEN-2026-0001');
      }
      expect(mockVendorRepo.createVendor).toHaveBeenCalledWith(
        expect.objectContaining({ name: input.name }),
        mockSession.user.tenantId,
      );
    });

    it('returns unauthorized when no session', async () => {
      mockAuth.mockResolvedValue(null);
      const result = await createVendor(createVendorInput());
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe(unauthorizedError);
      }
    });

    it('returns error when repo throws', async () => {
      mockVendorRepo.createVendor.mockRejectedValue(new Error('DB error'));
      const result = await createVendor(createVendorInput());
      expect(result.success).toBe(false);
    });
  });

  describe('updateVendor', () => {
    it('updates a vendor successfully when authorised', async () => {
      const mockVendor = createVendorWithDetails({ id: TEST_VENDOR_ID });
      mockVendorRepo.updateVendor.mockResolvedValue(mockVendor);

      const input = { ...createVendorInput(), id: TEST_VENDOR_ID };
      const result = await updateVendor(input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe(TEST_VENDOR_ID);
      }
      expect(mockVendorRepo.updateVendor).toHaveBeenCalledWith(
        TEST_VENDOR_ID,
        mockSession.user.tenantId,
        expect.objectContaining({ name: input.name }),
      );
    });

    it('returns error when vendor not found', async () => {
      mockVendorRepo.updateVendor.mockResolvedValue(null);
      const result = await updateVendor({ ...createVendorInput(), id: TEST_VENDOR_ID });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Failed to update vendor');
      }
    });

    it('returns unauthorized when no session', async () => {
      mockAuth.mockResolvedValue(null);
      const result = await updateVendor({ ...createVendorInput(), id: TEST_VENDOR_ID });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe(unauthorizedError);
      }
    });
  });

  describe('updateVendorStatus', () => {
    it('updates vendor status successfully when authorised', async () => {
      const mockVendor = {
        id: TEST_VENDOR_ID,
        vendorCode: 'VEN-2026-0001',
        status: 'INACTIVE',
      };
      mockVendorRepo.updateVendorStatus.mockResolvedValue(mockVendor);

      const result = await updateVendorStatus({ id: TEST_VENDOR_ID, status: 'INACTIVE' });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe(TEST_VENDOR_ID);
      }
      expect(mockVendorRepo.updateVendorStatus).toHaveBeenCalledWith(
        TEST_VENDOR_ID,
        mockSession.user.tenantId,
        'INACTIVE',
      );
    });

    it('returns unauthorized when no session', async () => {
      mockAuth.mockResolvedValue(null);
      const result = await updateVendorStatus({ id: TEST_VENDOR_ID, status: 'INACTIVE' });
      expect(result.success).toBe(false);
    });
  });

  describe('deleteVendor', () => {
    it('soft deletes a vendor successfully when authorised', async () => {
      const mockVendor = {
        id: TEST_VENDOR_ID,
        vendorCode: 'VEN-2026-0001',
        status: 'ACTIVE',
      };
      mockVendorRepo.softDeleteVendor.mockResolvedValue(mockVendor);

      const result = await deleteVendor({ id: TEST_VENDOR_ID });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe(TEST_VENDOR_ID);
      }
      expect(mockVendorRepo.softDeleteVendor).toHaveBeenCalledWith(
        TEST_VENDOR_ID,
        mockSession.user.tenantId,
      );
    });

    it('returns error when vendor has transactions', async () => {
      mockVendorRepo.softDeleteVendor.mockRejectedValue(
        new Error('Cannot delete vendor with associated transactions'),
      );

      const result = await deleteVendor({ id: TEST_VENDOR_ID });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Cannot delete vendor');
      }
    });

    it('returns unauthorized when no session', async () => {
      mockAuth.mockResolvedValue(null);
      const result = await deleteVendor({ id: TEST_VENDOR_ID });
      expect(result.success).toBe(false);
    });
  });
});

describe('Vendor Mutations - Permission Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockVendorRepo.createVendor.mockResolvedValue({
      id: TEST_VENDOR_ID,
      vendorCode: 'VEN-2026-0001',
    });
  });

  it('allows ADMIN role to create vendors', async () => {
    mockAuth.mockResolvedValue(mockSessions.admin());
    const result = await createVendor(createVendorInput());
    expect(result.success).toBe(true);
  });

  it('allows MANAGER role to create vendors', async () => {
    mockAuth.mockResolvedValue(mockSessions.manager());
    const result = await createVendor(createVendorInput());
    expect(result.success).toBe(true);
  });

  it('denies unauthenticated users', async () => {
    mockAuth.mockResolvedValue(null);
    const result = await createVendor(createVendorInput());
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('You must be signed in to perform this action');
    }
  });
});
