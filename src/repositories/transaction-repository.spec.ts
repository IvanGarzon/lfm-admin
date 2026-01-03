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
});
