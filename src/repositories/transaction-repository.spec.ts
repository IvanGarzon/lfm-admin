import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TransactionRepository } from './transaction-repository';
import { TransactionType, TransactionStatus } from '@/prisma/client';

// Mock Prisma Client
vi.mock('@/prisma/client', () => {
  return {
    PrismaClient: vi.fn(),
    TransactionType: {
      INCOME: 'INCOME',
      EXPENSE: 'EXPENSE',
    },
    TransactionStatus: {
      PENDING: 'PENDING',
      COMPLETED: 'COMPLETED',
      CANCELLED: 'CANCELLED',
    },
    Prisma: {
      PrismaClientKnownRequestError: class extends Error {},
      QueryMode: {
        insensitive: 'insensitive',
      },
    },
  };
});

const mockPrisma = {
  transaction: {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
    aggregate: vi.fn(),
  },
  transactionCategoryOnTransaction: {
    deleteMany: vi.fn(),
  },
  $transaction: vi.fn((input) => {
    if (Array.isArray(input)) return Promise.all(input);
    return input(mockPrisma);
  }),
};

describe('TransactionRepository', () => {
  let repository: TransactionRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    // @ts-ignore - manual mock of PrismaClient
    repository = new TransactionRepository(mockPrisma);
  });

  describe('searchAndPaginate', () => {
    it('calls count and findMany with correct arguments', async () => {
      const mockTransactions = [
        {
          id: 't1',
          type: TransactionType.INCOME,
          status: TransactionStatus.COMPLETED,
          amount: '100.00',
          currency: 'AUD',
          description: 'Test transaction',
          date: new Date(),
          categories: [],
          invoice: null,
        },
      ];
      mockPrisma.transaction.count.mockResolvedValue(1);
      mockPrisma.transaction.findMany.mockResolvedValue(mockTransactions);

      const params = {
        page: 1,
        perPage: 10,
      };

      const result = await repository.searchAndPaginate(params);

      expect(mockPrisma.transaction.count).toHaveBeenCalled();
      expect(mockPrisma.transaction.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
          take: 10,
        }),
      );
      expect(result.pagination.totalItems).toBe(1);
      expect(result.items).toHaveLength(1);
    });

    it('applies type filters correctly', async () => {
      mockPrisma.transaction.count.mockResolvedValue(0);
      mockPrisma.transaction.findMany.mockResolvedValue([]);

      await repository.searchAndPaginate({
        page: 1,
        perPage: 10,
        type: [TransactionType.INCOME],
      });

      expect(mockPrisma.transaction.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            type: { in: [TransactionType.INCOME] },
          }),
        }),
      );
    });

    it('applies search filters correctly', async () => {
      mockPrisma.transaction.count.mockResolvedValue(0);
      mockPrisma.transaction.findMany.mockResolvedValue([]);

      await repository.searchAndPaginate({
        page: 1,
        perPage: 10,
        search: 'test search',
      });

      expect(mockPrisma.transaction.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({ description: expect.anything() }),
              expect.objectContaining({ payee: expect.anything() }),
              expect.objectContaining({ referenceId: expect.anything() }),
            ]),
          }),
        }),
      );
    });

    it('applies sorting correctly', async () => {
      mockPrisma.transaction.count.mockResolvedValue(0);
      mockPrisma.transaction.findMany.mockResolvedValue([]);

      await repository.searchAndPaginate({
        page: 1,
        perPage: 10,
        sort: [{ id: 'amount', desc: true }],
      });

      expect(mockPrisma.transaction.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: [{ amount: 'desc' }],
        }),
      );
    });
  });

  describe('findByIdWithDetails', () => {
    it('returns transaction with all details when found', async () => {
      const mockTransaction = {
        id: 't1',
        type: TransactionType.INCOME,
        status: TransactionStatus.COMPLETED,
        amount: '250.50',
        currency: 'AUD',
        description: 'Invoice payment',
        payee: 'Acme Corp',
        date: new Date(),
        referenceNumber: 'TRX-12345678',
        referenceId: 'INV-001',
        invoiceId: 'inv-1',
        vendorId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        categories: [
          {
            category: {
              id: 'cat-1',
              name: 'Sales',
            },
          },
        ],
        attachments: [],
        invoice: {
          id: 'inv-1',
          invoiceNumber: 'INV-2026-001',
          customer: {
            firstName: 'John',
            lastName: 'Doe',
          },
        },
        vendor: null,
      };

      mockPrisma.transaction.findUnique.mockResolvedValue(mockTransaction);

      const result = await repository.findByIdWithDetails('t1');

      expect(result).toBeTruthy();
      expect(result?.id).toBe('t1');
      expect(result?.amount).toBe(250.5);
      expect(result?.payee).toBe('Acme Corp');
      expect(mockPrisma.transaction.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 't1' },
          include: expect.objectContaining({
            categories: expect.anything(),
            attachments: expect.anything(),
            invoice: expect.anything(),
            vendor: expect.anything(),
          }),
        }),
      );
    });

    it('returns null when transaction not found', async () => {
      mockPrisma.transaction.findUnique.mockResolvedValue(null);

      const result = await repository.findByIdWithDetails('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('createTransaction', () => {
    it('creates transaction and returns details via findByIdWithDetails', async () => {
      const mockCreatedTransaction = {
        id: 't-new',
      };

      const mockDetailedTransaction = {
        id: 't-new',
        type: TransactionType.EXPENSE,
        status: TransactionStatus.PENDING,
        amount: '100.00',
        currency: 'AUD',
        description: 'Office supplies',
        payee: 'Staples',
        date: new Date(),
        referenceNumber: 'TRX-87654321',
        referenceId: null,
        invoiceId: null,
        vendorId: 'vendor-1',
        createdAt: new Date(),
        updatedAt: new Date(),
        categories: [],
        attachments: [],
        invoice: null,
        vendor: {
          id: 'vendor-1',
          name: 'Staples',
        },
      };

      mockPrisma.transaction.create.mockResolvedValue(mockCreatedTransaction);
      mockPrisma.transaction.findUnique.mockResolvedValue(mockDetailedTransaction);

      const input = {
        type: TransactionType.EXPENSE,
        date: new Date(),
        amount: 100.0,
        currency: 'AUD',
        description: 'Office supplies',
        payee: 'Staples',
        status: TransactionStatus.PENDING,
        vendorId: 'vendor-1',
      };

      const result = await repository.createTransaction(input);

      expect(mockPrisma.transaction.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            type: input.type,
            amount: input.amount,
            description: input.description,
            payee: input.payee,
            vendorId: input.vendorId,
            referenceNumber: expect.stringMatching(/^TRX-[A-Z0-9]{8}$/),
          }),
          select: { id: true },
        }),
      );

      expect(mockPrisma.transaction.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 't-new' },
        }),
      );

      expect(result.id).toBe('t-new');
      expect(result.amount).toBe(100.0);
    });

    it('throws error if created transaction cannot be retrieved', async () => {
      mockPrisma.transaction.create.mockResolvedValue({ id: 't-new' });
      mockPrisma.transaction.findUnique.mockResolvedValue(null);

      const input = {
        type: TransactionType.EXPENSE,
        date: new Date(),
        amount: 100.0,
        currency: 'AUD',
        description: 'Office supplies',
        payee: 'Staples',
        status: TransactionStatus.PENDING,
      };

      await expect(repository.createTransaction(input)).rejects.toThrow(
        'Failed to retrieve created transaction',
      );
    });
  });

  describe('updateTransaction', () => {
    it('updates transaction and returns details via findByIdWithDetails', async () => {
      const mockUpdatedTransaction = {
        id: 't1',
      };

      const mockDetailedTransaction = {
        id: 't1',
        type: TransactionType.EXPENSE,
        status: TransactionStatus.COMPLETED,
        amount: '150.00',
        currency: 'AUD',
        description: 'Updated description',
        payee: 'Updated payee',
        date: new Date(),
        referenceNumber: 'TRX-12345678',
        referenceId: null,
        invoiceId: null,
        vendorId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        categories: [],
        attachments: [],
        invoice: null,
        vendor: null,
      };

      mockPrisma.transaction.update.mockResolvedValue(mockUpdatedTransaction);
      mockPrisma.transaction.findUnique.mockResolvedValue(mockDetailedTransaction);

      const input = {
        type: TransactionType.EXPENSE,
        description: 'Updated description',
        payee: 'Updated payee',
      };

      const result = await repository.updateTransaction('t1', input);

      expect(mockPrisma.transaction.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 't1' },
          data: expect.objectContaining({
            description: 'Updated description',
            payee: 'Updated payee',
          }),
        }),
      );

      expect(mockPrisma.transaction.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 't1' },
        }),
      );

      expect(result?.id).toBe('t1');
      expect(result?.amount).toBe(150.0);
    });

    it('deletes existing categories when categoryIds provided', async () => {
      mockPrisma.transactionCategoryOnTransaction.deleteMany.mockResolvedValue({ count: 2 });
      mockPrisma.transaction.update.mockResolvedValue({ id: 't1' });
      mockPrisma.transaction.findUnique.mockResolvedValue({
        id: 't1',
        amount: '100.00',
        type: TransactionType.EXPENSE,
        status: TransactionStatus.COMPLETED,
        currency: 'AUD',
        description: 'Test',
        payee: 'Test payee',
        date: new Date(),
        referenceNumber: 'TRX-12345678',
        referenceId: null,
        invoiceId: null,
        vendorId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        categories: [],
        attachments: [],
        invoice: null,
        vendor: null,
      });

      await repository.updateTransaction('t1', {
        categoryIds: ['cat-1', 'cat-2'],
      });

      expect(mockPrisma.transactionCategoryOnTransaction.deleteMany).toHaveBeenCalledWith({
        where: { transactionId: 't1' },
      });
    });

    it('returns null when update fails', async () => {
      mockPrisma.transaction.update.mockResolvedValue(null);

      const result = await repository.updateTransaction('t1', {
        description: 'Updated',
      });

      expect(result).toBeNull();
    });
  });

  describe('generateReferenceNumber', () => {
    it('generates reference number in correct format', async () => {
      const refNumber = await TransactionRepository.generateReferenceNumber();

      expect(refNumber).toMatch(/^TRX-[A-Z0-9]{8}$/);
    });
  });
});
