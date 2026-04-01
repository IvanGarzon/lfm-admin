import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getTransactions,
  getTransactionById,
  getTransactionStatistics,
  getTransactionCategories,
  getTransactionTrend,
  getTransactionCategoryBreakdown,
  getTopTransactionCategories,
} from '../queries';
import {
  testIds,
  mockSessions,
  createTransactionWithDetails,
  createTransactionStatistics,
  createTransactionTrend,
  createCategoryBreakdown,
  createTopCategory,
  createTransactionCategory,
} from '@/lib/testing';

const { mockTransactionRepo, mockAuth } = vi.hoisted(() => ({
  mockTransactionRepo: {
    searchAndPaginate: vi.fn(),
    findByIdWithDetails: vi.fn(),
    getStatistics: vi.fn(),
    getActiveCategories: vi.fn(),
    getMonthlyTransactionTrend: vi.fn(),
    getCategoryBreakdown: vi.fn(),
    getTopCategories: vi.fn(),
  },
  mockAuth: vi.fn(),
}));

vi.mock('@/repositories/transaction-repository', () => {
  return {
    TransactionRepository: vi.fn().mockImplementation(function () {
      return mockTransactionRepo;
    }),
  };
});

vi.mock('@/auth', () => ({
  auth: mockAuth,
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {},
}));

const TEST_TRANSACTION_ID = testIds.transaction();
const unauthorizedError = 'You must be signed in to perform this action';

describe('Transaction Queries', () => {
  const mockSession = mockSessions.manager();

  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue(mockSession);
  });

  describe('getTransactions', () => {
    it('returns paginated transactions successfully when authorized', async () => {
      const mockResult = {
        items: [
          createTransactionWithDetails({ id: '1' }),
          createTransactionWithDetails({ id: '2' }),
        ],
        pagination: { page: 1, perPage: 10, total: 2 },
      };

      mockTransactionRepo.searchAndPaginate.mockResolvedValue(mockResult);

      const result = await getTransactions({});

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(mockResult);
      }
      expect(mockTransactionRepo.searchAndPaginate).toHaveBeenCalled();
    });

    it('returns unauthorized when no session', async () => {
      mockAuth.mockResolvedValue(null);
      const result = await getTransactions({});
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe(unauthorizedError);
      }
    });

    it('applies filters correctly', async () => {
      const mockResult = {
        items: [createTransactionWithDetails()],
        pagination: { page: 1, perPage: 10, total: 1 },
      };

      mockTransactionRepo.searchAndPaginate.mockResolvedValue(mockResult);

      await getTransactions({ type: 'INCOME', search: 'test' });

      expect(mockTransactionRepo.searchAndPaginate).toHaveBeenCalled();
    });
  });

  describe('getTransactionById', () => {
    it('returns transaction details successfully when authorized', async () => {
      const mockTransaction = createTransactionWithDetails({ id: TEST_TRANSACTION_ID });

      mockTransactionRepo.findByIdWithDetails.mockResolvedValue(mockTransaction);

      const result = await getTransactionById(TEST_TRANSACTION_ID);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe(TEST_TRANSACTION_ID);
      }
    });

    it('returns error when transaction not found', async () => {
      mockTransactionRepo.findByIdWithDetails.mockResolvedValue(null);

      const result = await getTransactionById('non-existent');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Transaction not found');
      }
    });

    it('returns unauthorized when no session', async () => {
      mockAuth.mockResolvedValue(null);
      const result = await getTransactionById(TEST_TRANSACTION_ID);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe(unauthorizedError);
      }
    });

    it('converts Decimal amount to number', async () => {
      const mockTransaction = {
        ...createTransactionWithDetails(),
        amount: { toNumber: () => 150.5 } as unknown as number,
      };

      mockTransactionRepo.findByIdWithDetails.mockResolvedValue(mockTransaction);

      const result = await getTransactionById(TEST_TRANSACTION_ID);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(typeof result.data.amount).toBe('number');
      }
    });
  });

  describe('getTransactionStatistics', () => {
    it('returns statistics successfully when authorized', async () => {
      const mockStats = createTransactionStatistics();

      mockTransactionRepo.getStatistics.mockResolvedValue(mockStats);

      const result = await getTransactionStatistics(undefined);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.totalIncome).toBe(50000);
        expect(result.data.totalExpense).toBe(30000);
      }
    });

    it('returns statistics with date filter', async () => {
      const mockStats = createTransactionStatistics({ totalIncome: 25000 });
      mockTransactionRepo.getStatistics.mockResolvedValue(mockStats);

      const dateFilter = {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
      };

      const result = await getTransactionStatistics(dateFilter);

      expect(result.success).toBe(true);
      expect(mockTransactionRepo.getStatistics).toHaveBeenCalledWith(dateFilter);
    });

    it('returns unauthorized when no session', async () => {
      mockAuth.mockResolvedValue(null);
      const result = await getTransactionStatistics(undefined);
      expect(result.success).toBe(false);
    });
  });

  describe('getTransactionCategories', () => {
    it('returns categories successfully when authorized', async () => {
      const mockCategories = [
        createTransactionCategory({ id: '1', name: 'Sales' }),
        createTransactionCategory({ id: '2', name: 'Office Supplies' }),
      ];

      mockTransactionRepo.getActiveCategories.mockResolvedValue(mockCategories);

      const result = await getTransactionCategories(undefined);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(2);
      }
      expect(mockTransactionRepo.getActiveCategories).toHaveBeenCalled();
    });

    it('returns unauthorized when no session', async () => {
      mockAuth.mockResolvedValue(null);
      const result = await getTransactionCategories(undefined);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe(unauthorizedError);
      }
    });
  });

  describe('getTransactionTrend', () => {
    it('returns monthly trend successfully', async () => {
      const mockTrend = [
        createTransactionTrend({ month: '2024-01' }),
        createTransactionTrend({ month: '2024-02' }),
      ];

      mockTransactionRepo.getMonthlyTransactionTrend.mockResolvedValue(mockTrend);

      const result = await getTransactionTrend(12);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(2);
      }
      expect(mockTransactionRepo.getMonthlyTransactionTrend).toHaveBeenCalledWith(12);
    });

    it('uses default limit of 12 months', async () => {
      mockTransactionRepo.getMonthlyTransactionTrend.mockResolvedValue([]);

      await getTransactionTrend(undefined);

      expect(mockTransactionRepo.getMonthlyTransactionTrend).toHaveBeenCalledWith(12);
    });

    it('returns unauthorized when no session', async () => {
      mockAuth.mockResolvedValue(null);
      const result = await getTransactionTrend(undefined);
      expect(result.success).toBe(false);
    });
  });

  describe('getTransactionCategoryBreakdown', () => {
    it('returns category breakdown successfully', async () => {
      const mockBreakdown = [
        createCategoryBreakdown({ category: 'Sales', percentage: 60 }),
        createCategoryBreakdown({ category: 'Office Supplies', percentage: 40 }),
      ];

      mockTransactionRepo.getCategoryBreakdown.mockResolvedValue(mockBreakdown);

      const result = await getTransactionCategoryBreakdown(undefined);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(2);
      }
    });

    it('applies date filter correctly', async () => {
      mockTransactionRepo.getCategoryBreakdown.mockResolvedValue([]);

      const dateFilter = {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-06-30'),
      };

      await getTransactionCategoryBreakdown(dateFilter);

      expect(mockTransactionRepo.getCategoryBreakdown).toHaveBeenCalledWith(dateFilter);
    });

    it('returns unauthorized when no session', async () => {
      mockAuth.mockResolvedValue(null);
      const result = await getTransactionCategoryBreakdown(undefined);
      expect(result.success).toBe(false);
    });
  });

  describe('getTopTransactionCategories', () => {
    it('returns top categories successfully', async () => {
      const mockTopCategories = [
        createTopCategory({ categoryName: 'Sales', totalAmount: 10000 }),
        createTopCategory({ categoryName: 'Office Supplies', totalAmount: 5000 }),
      ];

      mockTransactionRepo.getTopCategories.mockResolvedValue(mockTopCategories);

      const result = await getTopTransactionCategories(5);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(2);
      }
      expect(mockTransactionRepo.getTopCategories).toHaveBeenCalledWith(5);
    });

    it('uses default limit of 5 categories', async () => {
      mockTransactionRepo.getTopCategories.mockResolvedValue([]);

      await getTopTransactionCategories(undefined);

      expect(mockTransactionRepo.getTopCategories).toHaveBeenCalledWith(5);
    });

    it('returns unauthorized when no session', async () => {
      mockAuth.mockResolvedValue(null);
      const result = await getTopTransactionCategories(undefined);
      expect(result.success).toBe(false);
    });
  });
});

describe('Transaction Queries - Permission Tests', () => {
  const mockUserRole = mockSessions.user();
  const mockManagerRole = mockSessions.manager();
  const mockAdminRole = mockSessions.admin();

  beforeEach(() => {
    vi.clearAllMocks();
    mockTransactionRepo.searchAndPaginate.mockResolvedValue({ items: [], pagination: {} });
    mockTransactionRepo.findByIdWithDetails.mockResolvedValue(createTransactionWithDetails());
  });

  describe('getTransactions', () => {
    it('should allow USER role to read transactions', async () => {
      mockAuth.mockResolvedValue(mockUserRole);

      const result = await getTransactions({});

      expect(result.success).toBe(true);
    });

    it('should allow MANAGER role to read transactions', async () => {
      mockAuth.mockResolvedValue(mockManagerRole);

      const result = await getTransactions({});

      expect(result.success).toBe(true);
    });

    it('should allow ADMIN role to read transactions', async () => {
      mockAuth.mockResolvedValue(mockAdminRole);

      const result = await getTransactions({});

      expect(result.success).toBe(true);
    });

    it('should deny unauthenticated users', async () => {
      mockAuth.mockResolvedValue(null);

      const result = await getTransactions({});

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('You must be signed in to perform this action');
      }
    });
  });

  describe('getTransactionById', () => {
    it('should allow USER role to read transaction details', async () => {
      mockAuth.mockResolvedValue(mockUserRole);

      const result = await getTransactionById(TEST_TRANSACTION_ID);

      expect(result.success).toBe(true);
    });
  });
});
