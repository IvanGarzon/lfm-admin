/**
 * Invoice Repository Unit Tests
 *
 * PURPOSE: Tests the data access layer (Repository pattern) in isolation.
 * These tests verify that the InvoiceRepository correctly interacts with
 * the Prisma client to perform database operations.
 *
 * SCOPE:
 * - Database query construction (correct WHERE clauses, JOINs, etc.)
 * - Data transformation logic within repository methods
 * - Transaction handling and rollback behavior
 * - Complex business logic that spans multiple database operations
 *   (e.g., addPayment creates payment + updates invoice + creates transaction)
 *
 * MOCKING STRATEGY:
 * - Prisma client is fully mocked to avoid database dependencies
 * - External services (PDF generation) are mocked to prevent side effects
 * - Repository methods are tested with controlled mock return values
 *
 * WHY SEPARATE FROM ACTION TESTS:
 * - Action tests verify authentication, permissions, and error handling
 * - Repository tests verify the actual database interaction logic
 * - This separation allows testing complex queries without auth overhead
 *
 * @see src/actions/finances/invoices/__tests__/ for action layer tests
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { InvoiceRepository } from './invoice-repository';
import { InvoiceStatus } from '@/prisma/client';
import { testIds, createInvoiceResponse, createInvoiceDetails } from '@/lib/testing';

// Mock the PDF service to prevent side effects during tests
vi.mock('@/features/finances/invoices/services/invoice-pdf.service', () => ({
  getOrGenerateReceiptPdf: vi.fn().mockResolvedValue({
    url: 'https://example.com/receipt.pdf',
    documentId: 'doc_123',
  }),
  getOrGenerateInvoicePdf: vi.fn().mockResolvedValue({
    url: 'https://example.com/invoice.pdf',
    documentId: 'doc_456',
  }),
}));

// Mock document for receipt generation
const mockDocument = {
  id: 'doc_123',
  kind: 'RECEIPT',
  url: 'https://example.com/receipt.pdf',
};

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
  payment: {
    create: vi.fn(),
    findUnique: vi.fn(),
  },
  transaction: {
    create: vi.fn(),
  },
  transactionCategory: {
    upsert: vi.fn(),
  },
  document: {
    findFirst: vi.fn().mockResolvedValue(mockDocument),
  },
  transactionAttachment: {
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
      const invoiceId = testIds.invoice();
      const mockInvoice = createInvoiceDetails({
        id: invoiceId,
        invoiceNumber: 'INV-001',
        items: [],
        payments: [],
      });
      mockPrisma.invoice.findUnique.mockResolvedValue(mockInvoice);

      const result = await repository.findByIdWithDetails(invoiceId);

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
        perPage: 10,
      };

      await repository.searchAndPaginate(filters);

      expect(mockPrisma.invoice.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.any(Array),
            status: { in: [InvoiceStatus.PENDING] },
          }),
          take: 10,
          skip: 0,
        }),
      );
    });
  });

  describe('markAsPending', () => {
    it('updates status and creates history entry', async () => {
      const invoiceId = testIds.invoice();
      const userId = testIds.user();
      const mockInvoice = createInvoiceResponse({ id: invoiceId, status: InvoiceStatus.DRAFT });
      mockPrisma.invoice.findUnique.mockResolvedValue(mockInvoice);
      mockPrisma.invoice.update.mockResolvedValue({
        ...mockInvoice,
        status: InvoiceStatus.PENDING,
      });

      // Need to mock findByIdWithDetails which is called at the end
      vi.spyOn(repository, 'findByIdWithDetails').mockResolvedValue(
        createInvoiceResponse({ id: invoiceId, status: InvoiceStatus.PENDING }) as any,
      );

      await repository.markAsPending(invoiceId, userId);

      expect(mockPrisma.invoice.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: invoiceId, deletedAt: null },
          data: expect.objectContaining({ status: InvoiceStatus.PENDING }),
        }),
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
      vi.spyOn(repository as any, 'getBasicStats').mockResolvedValue({
        total: 0,
        totalRevenue: 0,
        pendingRevenue: 0,
      });
      vi.spyOn(repository, 'getMonthlyRevenueTrend').mockResolvedValue([]);
      vi.spyOn(repository, 'getTopDebtors').mockResolvedValue([]);

      const stats = await repository.getStatistics();

      expect(stats.total).toBe(3);
      expect(stats.paid).toBe(1);
      expect(stats.pending).toBe(1);
      expect(stats.overdue).toBe(1);
    });
  });

  describe('addPayment', () => {
    it('creates payment, updates invoice, and creates transaction', async () => {
      const invoiceId = testIds.invoice();
      const userId = testIds.user();
      const categoryId = testIds.category();
      const transactionId = testIds.transaction();
      const mockInvoice = createInvoiceDetails({
        id: invoiceId,
        invoiceNumber: 'INV-001',
        status: InvoiceStatus.PENDING,
        amount: 100,
        currency: 'USD',
        amountPaid: 0,
      });

      mockPrisma.invoice.findUnique.mockResolvedValue(mockInvoice);
      mockPrisma.invoice.update.mockResolvedValue({
        ...mockInvoice,
        status: InvoiceStatus.PAID,
        amountPaid: 100,
        amountDue: 0,
      });
      mockPrisma.transactionCategory.upsert.mockResolvedValue({
        id: categoryId,
        name: 'Invoice Fully Payment',
      });
      mockPrisma.transaction.create.mockResolvedValue({
        id: transactionId,
      });

      // Mock findByIdWithDetails which is called at the end
      vi.spyOn(repository, 'findByIdWithDetails').mockResolvedValue(
        createInvoiceResponse({
          id: invoiceId,
          invoiceNumber: 'INV-001',
          status: InvoiceStatus.PAID,
        }) as any,
      );

      const paymentDate = new Date();
      await repository.addPayment(
        invoiceId,
        100,
        'Bank Transfer',
        paymentDate,
        'Full payment',
        userId,
      );

      // Verify payment creation
      expect(mockPrisma.payment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            invoiceId: invoiceId,
            amount: 100,
            method: 'Bank Transfer',
            date: paymentDate,
          }),
        }),
      );

      // Verify invoice update
      expect(mockPrisma.invoice.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: invoiceId },
          data: expect.objectContaining({
            status: InvoiceStatus.PAID,
            amountPaid: 100,
          }),
        }),
      );

      // Verify transaction creation
      expect(mockPrisma.transaction.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            type: 'INCOME',
            amount: expect.objectContaining({ value: 100 }),
            payee: 'John Doe',
            categories: expect.objectContaining({
              create: [{ categoryId: categoryId }],
            }),
          }),
        }),
      );
    });
  });
});
