import { describe, it, expect, beforeEach, vi } from 'vitest';
import { VendorRepository } from './vendor-repository';
import type { PrismaClient } from '@/prisma/client';

// Mock Prisma Client and enums
vi.mock('@/prisma/client', () => {
  class MockPrismaClientKnownRequestError extends Error {
    code: string;
    meta?: { target?: string[] };

    constructor(message: string, code: string, meta?: { target?: string[] }) {
      super(message);
      this.code = code;
      this.meta = meta;
      this.name = 'PrismaClientKnownRequestError';
    }
  }

  return {
    PrismaClient: vi.fn(),
    VendorStatus: {
      ACTIVE: 'ACTIVE',
      INACTIVE: 'INACTIVE',
      SUSPENDED: 'SUSPENDED',
    },
    Prisma: {
      PrismaClientKnownRequestError: MockPrismaClientKnownRequestError,
    },
  };
});

// Import VendorStatus and Prisma after mock
import { VendorStatus, Prisma } from '@/prisma/client';

const TEST_TENANT_ID = 'tenant-1';

const mockPrismaClient = {
  vendor: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    count: vi.fn(),
  },
  transaction: {
    count: vi.fn(),
  },
} as unknown as PrismaClient;

describe('VendorRepository', () => {
  let repository: VendorRepository;

  beforeEach(() => {
    repository = new VendorRepository(mockPrismaClient);
    vi.resetAllMocks();
  });

  describe('generateVendorCode', () => {
    it('should generate VEN-YYYY-0001 when no vendors exist for the year', async () => {
      vi.mocked(mockPrismaClient.vendor.findFirst).mockResolvedValue(null);

      const code = await repository.generateVendorCode(TEST_TENANT_ID);
      const year = new Date().getFullYear();

      expect(code).toBe(`VEN-${year}-0001`);
    });

    it('should increment vendor code when vendors exist', async () => {
      const year = new Date().getFullYear();
      vi.mocked(mockPrismaClient.vendor.findFirst).mockResolvedValue({
        vendorCode: `VEN-${year}-0005`,
      } as never);

      const code = await repository.generateVendorCode(TEST_TENANT_ID);

      expect(code).toBe(`VEN-${year}-0006`);
    });

    it('should pad vendor code with leading zeros', async () => {
      const year = new Date().getFullYear();
      vi.mocked(mockPrismaClient.vendor.findFirst).mockResolvedValue({
        vendorCode: `VEN-${year}-0099`,
      } as never);

      const code = await repository.generateVendorCode(TEST_TENANT_ID);

      expect(code).toBe(`VEN-${year}-0100`);
    });
  });

  describe('searchAndPaginate', () => {
    it('should return paginated vendors with default sorting', async () => {
      const mockVendors = [
        {
          id: '1',
          vendorCode: 'VEN-2026-0001',
          name: 'Acme Corp',
          email: 'contact@acme.com',
          phone: '1234567890',
          status: VendorStatus.ACTIVE,
          paymentTerms: 30,
          createdAt: new Date(),
          _count: { transactions: 5 },
        },
      ];

      vi.mocked(mockPrismaClient.vendor.findMany).mockResolvedValue(mockVendors as never);
      vi.mocked(mockPrismaClient.vendor.count).mockResolvedValue(1);

      const result = await repository.searchAndPaginate(
        {
          page: 1,
          perPage: 20,
          search: '',
          status: [],
        },
        TEST_TENANT_ID,
      );

      expect(result.items).toHaveLength(1);
      expect(result.items[0].name).toBe('Acme Corp');
      expect(result.items[0].transactionCount).toBe(5);
      expect(result.pagination.totalItems).toBe(1);
    });

    it('should filter by status', async () => {
      vi.mocked(mockPrismaClient.vendor.findMany).mockResolvedValue([] as never);
      vi.mocked(mockPrismaClient.vendor.count).mockResolvedValue(0);

      await repository.searchAndPaginate(
        {
          page: 1,
          perPage: 20,
          search: '',
          status: [VendorStatus.ACTIVE],
        },
        TEST_TENANT_ID,
      );

      expect(mockPrismaClient.vendor.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: { in: [VendorStatus.ACTIVE] },
          }),
        }),
      );
    });
  });

  describe('getStatistics', () => {
    it('should return vendor statistics', async () => {
      vi.mocked(mockPrismaClient.vendor.count)
        .mockResolvedValueOnce(100) // total
        .mockResolvedValueOnce(80) // active
        .mockResolvedValueOnce(15) // inactive
        .mockResolvedValueOnce(5); // suspended

      const stats = await repository.getStatistics(TEST_TENANT_ID);

      expect(stats).toEqual({
        total: 100,
        active: 80,
        inactive: 15,
        suspended: 5,
      });
    });
  });

  describe('softDeleteVendor', () => {
    it('should prevent deletion if vendor has transactions', async () => {
      vi.mocked(mockPrismaClient.transaction.count).mockResolvedValue(5);

      await expect(repository.softDeleteVendor('vendor-id', TEST_TENANT_ID)).rejects.toThrow(
        'Cannot delete vendor with associated transactions',
      );
    });

    it('should soft delete vendor with no transactions', async () => {
      vi.mocked(mockPrismaClient.transaction.count).mockResolvedValue(0);
      vi.mocked(mockPrismaClient.vendor.update).mockResolvedValue({
        id: 'vendor-id',
        deletedAt: new Date(),
      } as never);

      const result = await repository.softDeleteVendor('vendor-id', TEST_TENANT_ID);

      expect(result.deletedAt).toBeTruthy();
      expect(mockPrismaClient.vendor.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'vendor-id', tenantId: TEST_TENANT_ID, deletedAt: null },
          data: { deletedAt: expect.any(Date) },
        }),
      );
    });
  });

  describe('findByIdWithDetails', () => {
    it('should return vendor with full details', async () => {
      const mockVendor = {
        id: 'vendor-1',
        vendorCode: 'VEN-2026-0001',
        name: 'Acme Corp',
        email: 'contact@acme.com',
        phone: '1234567890',
        abn: '12345678901',
        status: VendorStatus.ACTIVE,
        address1: '123 Main St',
        address2: 'Suite 100',
        city: 'Sydney',
        region: 'NSW',
        postalCode: '2000',
        country: 'Australia',
        lat: -33.8688,
        lng: 151.2093,
        formattedAddress: '123 Main St, Suite 100, Sydney NSW 2000, Australia',
        website: 'https://acme.com',
        paymentTerms: 30,
        taxId: 'TAX123',
        notes: 'Preferred supplier',
        createdAt: new Date(),
        updatedAt: new Date(),
        _count: { transactions: 10 },
      };

      vi.mocked(mockPrismaClient.vendor.findUnique).mockResolvedValue(mockVendor as never);

      const result = await repository.findByIdWithDetails('vendor-1', TEST_TENANT_ID);

      expect(result).toBeTruthy();
      expect(result?.id).toBe('vendor-1');
      expect(result?.vendorCode).toBe('VEN-2026-0001');
      expect(result?.name).toBe('Acme Corp');
      expect(result?.transactionCount).toBe(10);
      expect(result?.address).toEqual({
        address1: '123 Main St',
        address2: 'Suite 100',
        city: 'Sydney',
        region: 'NSW',
        postalCode: '2000',
        country: 'Australia',
        lat: -33.8688,
        lng: 151.2093,
        formattedAddress: '123 Main St, Suite 100, Sydney NSW 2000, Australia',
      });
    });

    it('should return null when vendor not found', async () => {
      vi.mocked(mockPrismaClient.vendor.findUnique).mockResolvedValue(null);

      const result = await repository.findByIdWithDetails('nonexistent', TEST_TENANT_ID);

      expect(result).toBeNull();
    });

    it('should return vendor with null address when no address data exists', async () => {
      const mockVendor = {
        id: 'vendor-1',
        vendorCode: 'VEN-2026-0001',
        name: 'Acme Corp',
        email: 'contact@acme.com',
        phone: '1234567890',
        abn: '12345678901',
        status: VendorStatus.ACTIVE,
        address1: null,
        address2: null,
        city: null,
        region: null,
        postalCode: null,
        country: null,
        lat: null,
        lng: null,
        formattedAddress: null,
        website: null,
        paymentTerms: 30,
        taxId: null,
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        _count: { transactions: 0 },
      };

      vi.mocked(mockPrismaClient.vendor.findUnique).mockResolvedValue(mockVendor as never);

      const result = await repository.findByIdWithDetails('vendor-1', TEST_TENANT_ID);

      expect(result?.address).toBeNull();
    });
  });

  describe('createVendor', () => {
    it('should create vendor with auto-generated code', async () => {
      const year = new Date().getFullYear();
      const mockCreatedVendor = {
        id: 'vendor-new',
        vendorCode: `VEN-${year}-0001`,
      };

      vi.mocked(mockPrismaClient.vendor.findFirst).mockResolvedValue(null);
      vi.mocked(mockPrismaClient.vendor.create).mockResolvedValue(mockCreatedVendor as never);

      const input = {
        name: 'New Vendor',
        email: 'new@vendor.com',
        phone: '0400000000',
        status: VendorStatus.ACTIVE,
      };

      const result = await repository.createVendor(input, TEST_TENANT_ID);

      expect(result.id).toBe('vendor-new');
      expect(result.vendorCode).toBe(`VEN-${year}-0001`);
      expect(mockPrismaClient.vendor.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            name: 'New Vendor',
            email: 'new@vendor.com',
            vendorCode: `VEN-${year}-0001`,
          }),
        }),
      );
    });

    it('should retry on unique constraint violation', async () => {
      const year = new Date().getFullYear();
      const error = new Prisma.PrismaClientKnownRequestError('Unique constraint failed', 'P2002', {
        target: ['vendorCode'],
      });

      vi.mocked(mockPrismaClient.vendor.findFirst)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ vendorCode: `VEN-${year}-0001` } as never);

      vi.mocked(mockPrismaClient.vendor.create)
        .mockRejectedValueOnce(error)
        .mockResolvedValueOnce({
          id: 'vendor-new',
          vendorCode: `VEN-${year}-0002`,
        } as never);

      const input = {
        name: 'New Vendor',
        email: 'new@vendor.com',
        status: VendorStatus.ACTIVE,
      };

      const result = await repository.createVendor(input, TEST_TENANT_ID);

      expect(result.vendorCode).toBe(`VEN-${year}-0002`);
      expect(mockPrismaClient.vendor.create).toHaveBeenCalledTimes(2);
    });

    it('should throw error after max retry attempts', async () => {
      const error = new Prisma.PrismaClientKnownRequestError('Unique constraint failed', 'P2002', {
        target: ['vendorCode'],
      });

      vi.mocked(mockPrismaClient.vendor.findFirst).mockResolvedValue(null);
      vi.mocked(mockPrismaClient.vendor.create).mockRejectedValue(error);

      const input = {
        name: 'New Vendor',
        email: 'new@vendor.com',
        status: VendorStatus.ACTIVE,
      };

      await expect(repository.createVendor(input, TEST_TENANT_ID)).rejects.toThrow(
        'Failed to generate a unique vendor code',
      );
    });
  });

  describe('updateVendor', () => {
    it('should update vendor and return details via findByIdWithDetails', async () => {
      const mockExistingVendor = {
        id: 'vendor-1',
        vendorCode: 'VEN-2026-0001',
        name: 'Old Name',
        email: 'old@vendor.com',
        phone: null,
        abn: null,
        status: VendorStatus.ACTIVE,
        address1: null,
        address2: null,
        city: null,
        region: null,
        postalCode: null,
        country: null,
        lat: null,
        lng: null,
        formattedAddress: null,
        website: null,
        paymentTerms: null,
        taxId: null,
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        _count: { transactions: 0 },
      };

      const mockUpdatedVendor = {
        id: 'vendor-1',
        vendorCode: 'VEN-2026-0001',
      };

      const mockDetailedVendor = {
        id: 'vendor-1',
        vendorCode: 'VEN-2026-0001',
        name: 'Updated Name',
        email: 'updated@vendor.com',
        phone: '0400000001',
        abn: '98765432101',
        status: VendorStatus.ACTIVE,
        address1: '456 New St',
        address2: null,
        city: 'Melbourne',
        region: 'VIC',
        postalCode: '3000',
        country: 'Australia',
        lat: -37.8136,
        lng: 144.9631,
        formattedAddress: '456 New St, Melbourne VIC 3000, Australia',
        website: 'https://updated.com',
        paymentTerms: 45,
        taxId: 'TAX456',
        notes: 'Updated notes',
        createdAt: new Date(),
        updatedAt: new Date(),
        _count: { transactions: 5 },
      };

      vi.mocked(mockPrismaClient.vendor.findUnique).mockResolvedValueOnce(
        mockExistingVendor as never,
      );
      vi.mocked(mockPrismaClient.vendor.update).mockResolvedValue(mockUpdatedVendor as never);
      vi.mocked(mockPrismaClient.vendor.findUnique).mockResolvedValueOnce(
        mockDetailedVendor as never,
      );

      const input = {
        id: 'vendor-1',
        name: 'Updated Name',
        email: 'updated@vendor.com',
        phone: '0400000001',
        abn: '98765432101',
        status: VendorStatus.ACTIVE,
        address: {
          address1: '456 New St',
          address2: '',
          city: 'Melbourne',
          region: 'VIC',
          postalCode: '3000',
          country: 'Australia',
          lat: -37.8136,
          lng: 144.9631,
          formattedAddress: '456 New St, Melbourne VIC 3000, Australia',
        },
        website: 'https://updated.com',
        paymentTerms: 45,
        taxId: 'TAX456',
        notes: 'Updated notes',
      };

      const result = await repository.updateVendor('vendor-1', TEST_TENANT_ID, input);

      expect(mockPrismaClient.vendor.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'vendor-1', tenantId: TEST_TENANT_ID, deletedAt: null },
          data: expect.objectContaining({
            name: 'Updated Name',
            email: 'updated@vendor.com',
          }),
        }),
      );

      expect(result).toBeTruthy();
      expect(result?.id).toBe('vendor-1');
      expect(result?.name).toBe('Updated Name');
      expect(result?.transactionCount).toBe(5);
    });

    it('should return null when vendor not found', async () => {
      vi.mocked(mockPrismaClient.vendor.findUnique).mockResolvedValue(null);

      const input = {
        id: 'nonexistent',
        name: 'Updated Name',
        email: 'updated@vendor.com',
        status: VendorStatus.ACTIVE,
      };

      const result = await repository.updateVendor('nonexistent', TEST_TENANT_ID, input);

      expect(result).toBeNull();
      expect(mockPrismaClient.vendor.update).not.toHaveBeenCalled();
    });
  });

  describe('updateVendorStatus', () => {
    it('should update vendor status', async () => {
      const mockUpdatedVendor = {
        id: 'vendor-1',
        vendorCode: 'VEN-2026-0001',
        status: VendorStatus.INACTIVE,
      };

      vi.mocked(mockPrismaClient.vendor.update).mockResolvedValue(mockUpdatedVendor as never);

      const result = await repository.updateVendorStatus(
        'vendor-1',
        TEST_TENANT_ID,
        VendorStatus.INACTIVE,
      );

      expect(mockPrismaClient.vendor.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'vendor-1', tenantId: TEST_TENANT_ID, deletedAt: null },
          data: { status: VendorStatus.INACTIVE },
        }),
      );

      expect(result.status).toBe(VendorStatus.INACTIVE);
    });
  });

  describe('getActiveVendors', () => {
    it('should return only active vendors sorted by name', async () => {
      const mockVendors = [
        {
          id: 'vendor-1',
          vendorCode: 'VEN-2026-0001',
          name: 'Acme Corp',
        },
        {
          id: 'vendor-2',
          vendorCode: 'VEN-2026-0002',
          name: 'Beta Inc',
        },
      ];

      vi.mocked(mockPrismaClient.vendor.findMany).mockResolvedValue(mockVendors as never);

      const result = await repository.getActiveVendors(TEST_TENANT_ID);

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Acme Corp');
      expect(result[1].name).toBe('Beta Inc');
      expect(mockPrismaClient.vendor.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            tenantId: TEST_TENANT_ID,
            status: VendorStatus.ACTIVE,
            deletedAt: null,
          },
          orderBy: { name: 'asc' },
        }),
      );
    });
  });
});
