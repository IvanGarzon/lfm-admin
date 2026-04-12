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
    findFirst: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
    groupBy: vi.fn(),
    aggregate: vi.fn(),
  },
  invoiceItem: {
    findMany: vi.fn(),
    deleteMany: vi.fn(),
    update: vi.fn(),
    createMany: vi.fn(),
  },
  invoiceStatusHistory: {
    create: vi.fn(),
    findMany: vi.fn(),
  },
  payment: {
    create: vi.fn(),
    findUnique: vi.fn(),
    findMany: vi.fn(),
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

  describe('createInvoiceWithItems', () => {
    it('creates invoice with items and status history in a transaction', async () => {
      const customerId = testIds.customer();
      const newInvoiceId = testIds.invoice();

      mockPrisma.invoice.findFirst.mockResolvedValue(null);

      mockPrisma.invoice.create.mockResolvedValue({
        id: newInvoiceId,
        invoiceNumber: 'INV-2026-0001',
      });

      const input = {
        customerId,
        status: InvoiceStatus.DRAFT,
        currency: 'AUD',
        gst: 10,
        discount: 0,
        issuedDate: new Date(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        items: [
          { description: 'Service A', quantity: 2, unitPrice: 100, productId: null },
          { description: 'Service B', quantity: 1, unitPrice: 50, productId: null },
        ],
      };

      const result = await repository.createInvoiceWithItems(input, testIds.user());

      expect(result.id).toBe(newInvoiceId);
      expect(result.invoiceNumber).toBe('INV-2026-0001');
      expect(mockPrisma.invoice.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            customerId,
            status: InvoiceStatus.DRAFT,
            currency: 'AUD',
            items: expect.objectContaining({
              create: expect.arrayContaining([
                expect.objectContaining({ description: 'Service A', quantity: 2 }),
                expect.objectContaining({ description: 'Service B', quantity: 1 }),
              ]),
            }),
          }),
        }),
      );

      expect(mockPrisma.invoiceStatusHistory.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            invoiceId: newInvoiceId,
            status: InvoiceStatus.DRAFT,
            previousStatus: null,
            notes: 'Invoice created',
          }),
        }),
      );
    });

    it('calculates total amount correctly with GST and discount', async () => {
      const customerId = testIds.customer();
      const newInvoiceId = testIds.invoice();

      mockPrisma.invoice.findFirst.mockResolvedValue(null);
      mockPrisma.invoice.create.mockResolvedValue({
        id: newInvoiceId,
        invoiceNumber: 'INV-2026-0001',
      });

      const input = {
        customerId,
        status: InvoiceStatus.DRAFT,
        currency: 'AUD',
        gst: 10,
        discount: 20,
        issuedDate: new Date(),
        dueDate: new Date(),
        items: [
          { description: 'Item A', quantity: 2, unitPrice: 100, productId: null },
          { description: 'Item B', quantity: 1, unitPrice: 50, productId: null },
        ],
      };

      await repository.createInvoiceWithItems(input);

      expect(mockPrisma.invoice.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            amount: 255,
            amountDue: 255,
            amountPaid: 0,
          }),
        }),
      );
    });
  });

  describe('updateInvoiceWithItems', () => {
    it('updates invoice and manages items correctly for DRAFT invoice', async () => {
      const invoiceId = testIds.invoice();
      const existingItemId = testIds.invoiceItem();

      mockPrisma.invoice.findUnique.mockResolvedValue({
        id: invoiceId,
        status: InvoiceStatus.DRAFT,
        amountPaid: 0,
      });

      mockPrisma.invoice.update.mockResolvedValue({ id: invoiceId });

      vi.spyOn(repository, 'findByIdWithDetails').mockResolvedValue(
        createInvoiceDetails({ id: invoiceId }),
      );

      const input = {
        id: invoiceId,
        customerId: testIds.customer(),
        status: InvoiceStatus.DRAFT,
        currency: 'AUD',
        gst: 10,
        discount: 0,
        issuedDate: new Date(),
        dueDate: new Date(),
        items: [
          {
            id: existingItemId,
            description: 'Updated Item',
            quantity: 3,
            unitPrice: 100,
            productId: null,
          },
          { description: 'New Item', quantity: 1, unitPrice: 200, productId: null },
        ],
      };

      const result = await repository.updateInvoiceWithItems(invoiceId, input);

      expect(result).not.toBeNull();

      expect(mockPrisma.invoiceItem.deleteMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            invoiceId: input.id,
            id: { notIn: [existingItemId] },
          }),
        }),
      );

      expect(mockPrisma.invoiceItem.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: existingItemId },
          data: expect.objectContaining({
            description: 'Updated Item',
            quantity: 3,
          }),
        }),
      );

      expect(mockPrisma.invoiceItem.createMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.arrayContaining([
            expect.objectContaining({
              invoiceId: input.id,
              description: 'New Item',
              quantity: 1,
            }),
          ]),
        }),
      );
    });

    it('prevents content modification for PENDING invoices', async () => {
      const invoiceId = testIds.invoice();

      mockPrisma.invoice.findUnique.mockResolvedValue({
        id: invoiceId,
        status: InvoiceStatus.PENDING,
        amountPaid: 0,
      });

      const input = {
        id: invoiceId,
        customerId: testIds.customer(),
        status: InvoiceStatus.PENDING,
        currency: 'AUD',
        gst: 15, // Trying to change GST
        discount: 0,
        issuedDate: new Date(),
        dueDate: new Date(),
        items: [{ description: 'Item', quantity: 1, unitPrice: 100, productId: null }],
      };

      await expect(repository.updateInvoiceWithItems(invoiceId, input)).rejects.toThrow(
        /content cannot be modified/,
      );
    });

    it('returns null when invoice not found', async () => {
      mockPrisma.invoice.findUnique.mockResolvedValue(null);

      const input = {
        id: 'non-existent',
        customerId: testIds.customer(),
        status: InvoiceStatus.DRAFT,
        currency: 'AUD',
        gst: 10,
        discount: 0,
        issuedDate: new Date(),
        dueDate: new Date(),
        items: [],
      };

      await expect(repository.updateInvoiceWithItems('non-existent', input)).rejects.toThrow(
        'Invoice not found',
      );
    });
  });

  describe('cancelInvoice', () => {
    it('cancels invoice and creates status history', async () => {
      const invoiceId = testIds.invoice();
      const userId = testIds.user();
      const cancelDate = new Date();
      const cancelReason = 'Customer requested cancellation';

      mockPrisma.invoice.findUnique.mockResolvedValue({
        id: invoiceId,
        status: InvoiceStatus.PENDING,
      });

      mockPrisma.invoice.update.mockResolvedValue({
        id: invoiceId,
        status: InvoiceStatus.CANCELLED,
      });
      vi.spyOn(repository, 'findByIdWithDetails').mockResolvedValue(
        createInvoiceDetails({ id: invoiceId, status: 'CANCELLED' }),
      );

      const result = await repository.cancelInvoice(invoiceId, cancelDate, cancelReason, userId);

      expect(result).not.toBeNull();
      expect(result?.status).toBe('CANCELLED');

      expect(mockPrisma.invoice.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: invoiceId, deletedAt: null },
          data: expect.objectContaining({
            status: InvoiceStatus.CANCELLED,
            cancelledDate: cancelDate,
            cancelReason,
          }),
        }),
      );

      expect(mockPrisma.invoiceStatusHistory.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            invoiceId,
            status: InvoiceStatus.CANCELLED,
            previousStatus: InvoiceStatus.PENDING,
            notes: `Cancelled: ${cancelReason}`,
          }),
        }),
      );
    });

    it('returns null when invoice not found', async () => {
      mockPrisma.invoice.findUnique.mockResolvedValue(null);

      const result = await repository.cancel('non-existent', new Date(), 'reason');

      expect(result).toBeNull();
    });

    it('throws error for invalid status transition (PAID cannot be cancelled)', async () => {
      const invoiceId = testIds.invoice();

      mockPrisma.invoice.findUnique.mockResolvedValue({
        id: invoiceId,
        status: InvoiceStatus.PAID,
      });

      await expect(
        repository.cancel(invoiceId, new Date(), 'Try to cancel paid'),
      ).rejects.toThrow();
    });
  });

  describe('deleteInvoice', () => {
    it('soft deletes DRAFT invoice successfully', async () => {
      const invoiceId = testIds.invoice();

      mockPrisma.invoice.findUnique.mockResolvedValue({
        id: invoiceId,
        status: InvoiceStatus.DRAFT,
      });

      mockPrisma.invoice.update.mockResolvedValue({ id: invoiceId });

      const result = await repository.deleteInvoice(invoiceId);

      expect(result).toBe(true);
      expect(mockPrisma.invoice.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: invoiceId, deletedAt: null },
          data: expect.objectContaining({
            deletedAt: expect.any(Date),
          }),
        }),
      );
    });

    it('throws error when trying to delete non-DRAFT invoice', async () => {
      const invoiceId = testIds.invoice();

      mockPrisma.invoice.findUnique.mockResolvedValue({
        id: invoiceId,
        status: InvoiceStatus.PENDING,
      });

      await expect(repository.softDelete(invoiceId)).rejects.toThrow(
        'Only DRAFT invoices can be deleted',
      );
    });

    it('throws error when invoice not found', async () => {
      mockPrisma.invoice.findUnique.mockResolvedValue(null);

      await expect(repository.softDelete('non-existent')).rejects.toThrow('Invoice not found');
    });
  });

  describe('duplicateInvoice', () => {
    it('creates a new DRAFT invoice with copied items', async () => {
      const originalId = testIds.invoice();
      const duplicateId = testIds.invoice();

      mockPrisma.invoice.findUnique.mockResolvedValue({
        id: originalId,
        customerId: testIds.customer(),
        amount: 500,
        currency: 'AUD',
        gst: 50,
        discount: 10,
        notes: 'Original notes',
        items: [
          { description: 'Item 1', quantity: 2, unitPrice: 100, total: 200, productId: null },
          { description: 'Item 2', quantity: 3, unitPrice: 100, total: 300, productId: null },
        ],
      });

      mockPrisma.invoice.findFirst.mockResolvedValue({ invoiceNumber: 'INV-2026-0005' });

      mockPrisma.invoice.create.mockResolvedValue({
        id: duplicateId,
        invoiceNumber: 'INV-2026-0006',
      });

      const result = await repository.duplicate(originalId);

      expect(result.id).toBe(duplicateId);
      expect(result.invoiceNumber).toBe('INV-2026-0006');

      expect(mockPrisma.invoice.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: InvoiceStatus.DRAFT,
            amountPaid: 0,
            remindersSent: 0,
            paidDate: null,
            paymentMethod: null,
            receiptNumber: null,
            cancelledDate: null,
            cancelReason: null,
            items: expect.objectContaining({
              create: expect.arrayContaining([
                expect.objectContaining({ description: 'Item 1', quantity: 2 }),
                expect.objectContaining({ description: 'Item 2', quantity: 3 }),
              ]),
            }),
          }),
        }),
      );
    });

    it('throws error when original invoice not found', async () => {
      mockPrisma.invoice.findUnique.mockResolvedValue(null);

      await expect(repository.duplicate('non-existent')).rejects.toThrow('Invoice not found');
    });
  });

  describe('markAsDraft', () => {
    it('reverts PENDING invoice to DRAFT', async () => {
      const invoiceId = testIds.invoice();
      const userId = testIds.user();

      mockPrisma.invoice.findUnique.mockResolvedValue({
        id: invoiceId,
        status: InvoiceStatus.PENDING,
      });

      mockPrisma.invoice.update.mockResolvedValue({
        id: invoiceId,
        status: InvoiceStatus.DRAFT,
      });

      vi.spyOn(repository, 'findByIdWithDetails').mockResolvedValue(
        createInvoiceDetails({ id: invoiceId, status: 'DRAFT' }),
      );

      const result = await repository.markAsDraft(invoiceId, userId);

      expect(result).not.toBeNull();
      expect(result?.status).toBe('DRAFT');

      expect(mockPrisma.invoice.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: InvoiceStatus.DRAFT }),
        }),
      );

      expect(mockPrisma.invoiceStatusHistory.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: InvoiceStatus.DRAFT,
            previousStatus: InvoiceStatus.PENDING,
            notes: 'Reverted to draft',
          }),
        }),
      );
    });

    it('returns null when invoice not found', async () => {
      mockPrisma.invoice.findUnique.mockResolvedValue(null);

      const result = await repository.markAsDraft('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('bulkUpdateStatus', () => {
    it('updates multiple invoices and returns results', async () => {
      const invoiceId1 = testIds.invoice();
      const invoiceId2 = testIds.invoice();
      const userId = testIds.user();

      // Mock findUnique to return different statuses for each invoice
      mockPrisma.invoice.findUnique
        .mockResolvedValueOnce({ id: invoiceId1, status: InvoiceStatus.DRAFT })
        .mockResolvedValueOnce({ id: invoiceId2, status: InvoiceStatus.DRAFT });

      mockPrisma.invoice.update.mockResolvedValue({});

      const results = await repository.bulkUpdateStatus(
        [invoiceId1, invoiceId2],
        InvoiceStatus.PENDING,
        userId,
      );

      expect(results).toHaveLength(2);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(true);

      expect(mockPrisma.invoice.update).toHaveBeenCalledTimes(2);
      expect(mockPrisma.invoiceStatusHistory.create).toHaveBeenCalledTimes(2);
    });

    it('handles partial failures gracefully', async () => {
      const invoiceId1 = testIds.invoice();
      const invoiceId2 = testIds.invoice();

      // First invoice is DRAFT (valid transition to PENDING)
      // Second invoice is PAID (invalid transition to PENDING)
      mockPrisma.invoice.findUnique
        .mockResolvedValueOnce({ id: invoiceId1, status: InvoiceStatus.DRAFT })
        .mockResolvedValueOnce({ id: invoiceId2, status: InvoiceStatus.PAID });

      mockPrisma.invoice.update.mockResolvedValue({});

      const results = await repository.bulkUpdateStatus(
        [invoiceId1, invoiceId2],
        InvoiceStatus.PENDING,
      );

      expect(results).toHaveLength(2);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(false);
      expect(results[1].error).toBeDefined();
    });

    it('skips invoices already in target status', async () => {
      const invoiceId = testIds.invoice();

      mockPrisma.invoice.findUnique.mockResolvedValue({
        id: invoiceId,
        status: InvoiceStatus.PENDING,
      });

      const results = await repository.bulkUpdateStatus([invoiceId], InvoiceStatus.PENDING);

      expect(results[0].success).toBe(true);
      // Should not call update if already in target status
      expect(mockPrisma.invoice.update).not.toHaveBeenCalled();
    });
  });

  // ============================================================================
  // SIMPLE QUERY TESTS
  // ============================================================================

  describe('findByIdMetadata ', () => {
    it('returns basic invoice info with counts', async () => {
      const invoiceId = testIds.invoice();

      mockPrisma.invoice.findUnique.mockResolvedValue({
        id: invoiceId,
        invoiceNumber: 'INV-001',
        status: InvoiceStatus.PENDING,
        amount: { toNumber: () => 100 },
        gst: { toNumber: () => 10 },
        discount: { toNumber: () => 0 },
        amountPaid: { toNumber: () => 0 },
        amountDue: { toNumber: () => 100 },
        currency: 'AUD',
        issuedDate: new Date(),
        dueDate: new Date(),
        customer: { id: testIds.customer(), firstName: 'John', lastName: 'Doe' },
        _count: { payments: 2, statusHistory: 3, items: 5 },
      });

      const result = await repository.findByIdMetadata(invoiceId);

      expect(result).not.toBeNull();
      expect(result?.invoiceNumber).toBe('INV-001');
      expect(mockPrisma.invoice.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: invoiceId, deletedAt: null },
        }),
      );
    });

    it('returns null when invoice not found', async () => {
      mockPrisma.invoice.findUnique.mockResolvedValue(null);

      const result = await repository.findByIdMetadata('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('findInvoiceItems', () => {
    it('returns invoice items with transformed decimal values', async () => {
      const invoiceId = testIds.invoice();

      // The repository uses Number() to transform values, so we mock plain numbers
      mockPrisma.invoiceItem.findMany.mockResolvedValue([
        {
          id: testIds.invoiceItem(),
          invoiceId,
          description: 'Service A',
          quantity: 2,
          unitPrice: 100,
          total: 200,
          productId: null,
        },
        {
          id: testIds.invoiceItem(),
          invoiceId,
          description: 'Service B',
          quantity: 1,
          unitPrice: 50,
          total: 50,
          productId: null,
        },
      ]);

      const result = await repository.findInvoiceItems(invoiceId);

      expect(result).toHaveLength(2);
      expect(result[0].description).toBe('Service A');
      expect(result[0].quantity).toBe(2);
      expect(result[1].description).toBe('Service B');
      expect(mockPrisma.invoiceItem.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { invoiceId },
          orderBy: { createdAt: 'asc' },
        }),
      );
    });
  });

  describe('findInvoicePayments', () => {
    it('returns invoice payments with transformed amounts', async () => {
      const invoiceId = testIds.invoice();
      const paymentDate = new Date();

      // The repository uses Number() to transform values, so we mock plain numbers
      mockPrisma.payment.findMany.mockResolvedValue([
        {
          id: testIds.payment(),
          amount: 50,
          date: paymentDate,
          method: 'Credit Card',
          reference: 'REF-001',
          notes: 'Partial payment',
        },
      ]);

      const result = await repository.findInvoicePayments(invoiceId);

      expect(result).toHaveLength(1);
      expect(result[0].amount).toBe(50);
      expect(result[0].method).toBe('Credit Card');
      expect(mockPrisma.payment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { invoiceId },
          orderBy: { date: 'desc' },
        }),
      );
    });
  });

  describe('findInvoiceStatusHistory', () => {
    it('returns status history ordered by date', async () => {
      const invoiceId = testIds.invoice();

      mockPrisma.invoiceStatusHistory.findMany.mockResolvedValue([
        {
          id: '1',
          status: InvoiceStatus.DRAFT,
          previousStatus: null,
          updatedAt: new Date('2024-01-01'),
          user: { id: testIds.user(), firstName: 'Admin', lastName: 'User' },
          notes: 'Invoice created',
        },
        {
          id: '2',
          status: InvoiceStatus.PENDING,
          previousStatus: InvoiceStatus.DRAFT,
          updatedAt: new Date('2024-01-02'),
          user: { id: testIds.user(), firstName: 'Admin', lastName: 'User' },
          notes: 'Marked as pending',
        },
      ]);

      const result = await repository.findInvoiceStatusHistory(invoiceId);

      expect(result).toHaveLength(2);
      expect(result[0].status).toBe(InvoiceStatus.DRAFT);
      expect(result[1].status).toBe(InvoiceStatus.PENDING);
      expect(mockPrisma.invoiceStatusHistory.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { invoiceId },
          orderBy: { updatedAt: 'asc' },
        }),
      );
    });
  });

  // ============================================================================
  // UTILITY METHOD TESTS
  // ============================================================================

  describe('generateInvoiceNumber', () => {
    it('generates first invoice number of the year when no invoices exist', async () => {
      mockPrisma.invoice.findFirst.mockResolvedValue(null);

      const result = await repository.generateInvoiceNumber();

      const year = new Date().getFullYear();
      expect(result).toBe(`INV-${year}-0001`);
    });

    it('increments from last invoice number', async () => {
      const year = new Date().getFullYear();
      mockPrisma.invoice.findFirst.mockResolvedValue({
        invoiceNumber: `INV-${year}-0042`,
      });

      const result = await repository.generateInvoiceNumber();

      expect(result).toBe(`INV-${year}-0043`);
    });
  });

  describe('generateReceiptNumber', () => {
    it('generates unique receipt number with RCP prefix', async () => {
      const result = await repository.generateReceiptNumber();

      expect(result).toMatch(/^RCP-[A-F0-9]{8}$/);
    });

    it('generates different numbers on subsequent calls', async () => {
      const result1 = await repository.generateReceiptNumber();
      const result2 = await repository.generateReceiptNumber();

      expect(result1).not.toBe(result2);
    });
  });

  describe('incrementReminderCount', () => {
    it('increments reminder count for existing invoice', async () => {
      const invoiceId = testIds.invoice();

      // Mock findById (from base repository)
      vi.spyOn(repository, 'findById').mockResolvedValue({
        id: invoiceId,
        remindersSent: 2,
      } as any);

      mockPrisma.invoice.update.mockResolvedValue({
        id: invoiceId,
        remindersSent: 3,
      });

      const result = await repository.incrementReminderCount(invoiceId);

      expect(result?.remindersSent).toBe(3);
      expect(mockPrisma.invoice.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: invoiceId },
          data: expect.objectContaining({
            remindersSent: 3,
          }),
        }),
      );
    });

    it('returns null when invoice not found', async () => {
      vi.spyOn(repository, 'findById').mockResolvedValue(null);

      const result = await repository.incrementReminderCount('non-existent');

      expect(result).toBeNull();
    });
  });

  // ============================================================================
  // ANALYTICS TESTS
  // ============================================================================

  describe('getMonthlyRevenueTrend', () => {
    it('returns monthly revenue data in chronological order', async () => {
      // Mock returns data in DESC order (most recent first)
      // Implementation reverses to chronological order
      mockPrisma.$queryRaw.mockResolvedValue([
        { month: 'Feb', month_num: 2, year: 2026, total: 12000, paid: 10000 },
        { month: 'Jan', month_num: 1, year: 2026, total: 10000, paid: 8000 },
      ]);

      const result = await repository.getMonthlyRevenueTrend(12);

      expect(result).toHaveLength(2);
      // After reverse, Jan comes first (chronological order)
      expect(result[0].month).toBe('Jan 2026');
      expect(result[0].total).toBe(10000);
      expect(result[0].paid).toBe(8000);
      expect(result[1].month).toBe('Feb 2026');
    });

    it('returns empty array when no data', async () => {
      mockPrisma.$queryRaw.mockResolvedValue([]);

      const result = await repository.getMonthlyRevenueTrend(12);

      expect(result).toEqual([]);
    });
  });

  describe('getTopDebtors', () => {
    it('returns top debtors with outstanding amounts', async () => {
      mockPrisma.$queryRaw.mockResolvedValue([
        { customerId: 'cust-1', customerName: 'John Doe', amountDue: 5000, invoiceCount: 3 },
        { customerId: 'cust-2', customerName: 'Jane Smith', amountDue: 3000, invoiceCount: 2 },
      ]);

      const result = await repository.getTopDebtors(5);

      expect(result).toHaveLength(2);
      expect(result[0].customerName).toBe('John Doe');
      expect(result[0].amountDue).toBe(5000);
      expect(result[0].invoiceCount).toBe(3);
    });

    it('returns empty array when no debtors', async () => {
      mockPrisma.$queryRaw.mockResolvedValue([]);

      const result = await repository.getTopDebtors(5);

      expect(result).toEqual([]);
    });
  });
});
