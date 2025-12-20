import { describe, it, expect, vi, beforeEach } from 'vitest';
import { InvoiceRepository } from './invoice-repository';
import { InvoiceStatus } from '@/prisma/client';

const mockPrisma = {
  invoice: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
    groupBy: vi.fn(),
    aggregate: vi.fn(),
  },
  invoiceStatusHistory: {
    create: vi.fn(),
  },
  $transaction: vi.fn((input) => {
    if (Array.isArray(input)) return Promise.all(input);
    return input(mockPrisma);
  }),
  $queryRaw: vi.fn(),
};

describe('InvoiceRepository', () => {
  let repository: InvoiceRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    // @ts-ignore - manual mock of PrismaClient
    repository = new InvoiceRepository(mockPrisma);
  });

  describe('findByIdWithDetails', () => {
    it('returns an invoice with details when it exists', async () => {
      const mockInvoice = { 
        id: 'inv_123', 
        invoiceNumber: 'INV-001',
        customer: { firstName: 'John', lastName: 'Doe' },
        items: [],
        payments: [],
        amount: "100",
        gst: "10",
        discount: "0",
        amountPaid: "0",
        amountDue: "100"
      };
      mockPrisma.invoice.findUnique.mockResolvedValue(mockInvoice);

      const result = await repository.findByIdWithDetails('inv_123');
      
      expect(result?.invoiceNumber).toBe('INV-001');
      expect(mockPrisma.invoice.findUnique).toHaveBeenCalled();
    });

    it('returns null when invoice does not exist', async () => {
      mockPrisma.invoice.findUnique.mockResolvedValue(null);
      const result = await repository.findByIdWithDetails('non_existent');
      expect(result).toBeNull();
    });
  });

  describe('searchAndPaginate', () => {
    it('calls findMany with correct filters', async () => {
      mockPrisma.invoice.findMany.mockResolvedValue([]);
      mockPrisma.invoice.count.mockResolvedValue(0);

      const filters = {
        search: 'INV-001',
        status: [InvoiceStatus.PENDING],
        page: 1,
        perPage: 10
      };

      await repository.searchAndPaginate(filters);

      expect(mockPrisma.invoice.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.any(Array),
            status: { in: [InvoiceStatus.PENDING] }
          }),
          take: 10,
          skip: 0
        })
      );
    });
  });

  describe('markAsPending', () => {
    it('updates status and creates history entry', async () => {
      const mockInvoice = { id: 'inv_123', status: InvoiceStatus.DRAFT };
      mockPrisma.invoice.findUnique.mockResolvedValue(mockInvoice);
      mockPrisma.invoice.update.mockResolvedValue({ ...mockInvoice, status: InvoiceStatus.PENDING });
      
      // Need to mock findByIdWithDetails which is called at the end
      vi.spyOn(repository, 'findByIdWithDetails').mockResolvedValue({ id: 'inv_123', status: InvoiceStatus.PENDING } as any);

      await repository.markAsPending('inv_123', 'user_123');

      expect(mockPrisma.invoice.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'inv_123', deletedAt: null },
          data: expect.objectContaining({ status: InvoiceStatus.PENDING })
        })
      );
    });
  });

  describe('getStatistics', () => {
    it('calculates statistics correctly', async () => {
      const mockStatusData = [
        { status: InvoiceStatus.PAID, _count: 1, _sum: { amount: 100 } },
        { status: InvoiceStatus.PENDING, _count: 1, _sum: { amount: 200 } },
        { status: InvoiceStatus.OVERDUE, _count: 1, _sum: { amount: 150 } },
      ];
      mockPrisma.invoice.groupBy.mockResolvedValue(mockStatusData);
      mockPrisma.$queryRaw.mockResolvedValue([{ avg: 150 }]);
      
      // Mock internal methods
      vi.spyOn(repository as any, 'getBasicStats').mockResolvedValue({ total: 0, totalRevenue: 0, pendingRevenue: 0 });
      vi.spyOn(repository, 'getMonthlyRevenueTrend').mockResolvedValue([]);
      vi.spyOn(repository, 'getTopDebtors').mockResolvedValue([]);

      const stats = await repository.getStatistics();

      expect(stats.total).toBe(3);
      expect(stats.paid).toBe(1);
      expect(stats.pending).toBe(1);
      expect(stats.overdue).toBe(1);
    });
  });
});
