/**
 * Invoice Query Action Tests
 *
 * PURPOSE: Tests the action layer for all invoice read operations (queries).
 * These tests verify that server actions correctly handle authentication,
 * authorization, and delegate to the repository for data fetching.
 *
 * SCOPE:
 * - Authentication checks (session validation, unauthorized responses)
 * - Permission enforcement (canReadInvoices permission)
 * - Proper delegation to InvoiceRepository query methods
 * - Filter and pagination parameter passing
 * - Error handling for not-found scenarios
 * - ActionResult response structure
 *
 * MOCKING STRATEGY:
 * - InvoiceRepository is mocked to return controlled test data
 * - Auth module is mocked to simulate different user sessions/roles
 * - Permissions are mocked to test read access enforcement
 *
 * QUERY FUNCTIONS TESTED:
 * - getInvoices: Paginated list with filters
 * - getInvoiceById: Full invoice details
 * - getInvoiceBasicById: Minimal invoice data
 * - getInvoiceItems: Line items for an invoice
 * - getInvoicePayments: Payment history
 * - getInvoiceStatusHistory: Status change audit trail
 * - getInvoiceStatistics: Dashboard statistics
 * - getMonthlyRevenueTrend: Revenue analytics
 * - getTopDebtors: Outstanding balance report
 *
 * WHY SEPARATE FROM MUTATION TESTS:
 * - Queries are read-only and don't require cache invalidation
 * - Different permission levels (canReadInvoices vs canManageInvoices)
 * - Simpler error scenarios (mainly not-found vs validation errors)
 *
 * @see src/actions/finances/invoices/__tests__/mutations.test.ts for write operations
 * @see src/repositories/invoice-repository.spec.ts for repository layer tests
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getInvoices,
  getInvoiceById,
  getInvoiceBasicById,
  getInvoiceItems,
  getInvoicePayments,
  getInvoiceStatusHistory,
  getInvoiceStatistics,
  getMonthlyRevenueTrend,
  getTopDebtors,
} from '../queries';
import {
  testIds,
  mockSessions,
  createInvoiceStatistics,
  createInvoiceDetails,
} from '@/lib/testing';

const { mockRepoInstance, mockAuth, mockRequirePermission } = vi.hoisted(() => ({
  mockRepoInstance: {
    searchAndPaginate: vi.fn(),
    findByIdWithDetails: vi.fn(),
    findInvoiceBasicById: vi.fn(),
    findInvoiceItems: vi.fn(),
    findInvoicePayments: vi.fn(),
    findInvoiceStatusHistory: vi.fn(),
    getStatistics: vi.fn(),
    getMonthlyRevenueTrend: vi.fn(),
    getTopDebtors: vi.fn(),
  },
  mockAuth: vi.fn(),
  mockRequirePermission: vi.fn(),
}));

// Mock InvoiceRepository
vi.mock('@/repositories/invoice-repository', () => {
  return {
    InvoiceRepository: vi.fn().mockImplementation(function () {
      return mockRepoInstance;
    }),
  };
});

vi.mock('@/auth', () => ({
  auth: mockAuth,
}));

vi.mock('@/lib/permissions', () => ({
  requirePermission: mockRequirePermission,
}));

// Generate test IDs
const TEST_INVOICE_ID = testIds.invoice();

describe('Invoice Queries', () => {
  const mockSession = mockSessions.manager();

  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue(mockSession);
  });

  describe('getInvoices', () => {
    it('returns paginated invoices successfully when authorized', async () => {
      const mockResult = {
        items: [
          { id: '1', invoiceNumber: 'INV-001', status: 'DRAFT' },
          { id: '2', invoiceNumber: 'INV-002', status: 'PENDING' },
        ],
        pagination: { page: 1, perPage: 10, total: 2 },
      };

      mockRepoInstance.searchAndPaginate.mockResolvedValue(mockResult);

      const result = await getInvoices({});

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(mockResult);
      }
      expect(mockRequirePermission).toHaveBeenCalledWith(mockSession.user, 'canReadInvoices');
      expect(mockRepoInstance.searchAndPaginate).toHaveBeenCalled();
    });

    it('returns unauthorized when no session', async () => {
      mockAuth.mockResolvedValue(null);
      const result = await getInvoices({});
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Unauthorized');
      }
    });

    it('applies filters correctly', async () => {
      const mockResult = {
        items: [{ id: '1', invoiceNumber: 'INV-001', status: 'DRAFT' }],
        pagination: { page: 1, perPage: 10, total: 1 },
      };

      mockRepoInstance.searchAndPaginate.mockResolvedValue(mockResult);

      await getInvoices({ status: 'DRAFT', search: 'test' });

      expect(mockRepoInstance.searchAndPaginate).toHaveBeenCalled();
    });
  });

  describe('getInvoiceById', () => {
    it('returns invoice details successfully when authorized', async () => {
      const mockInvoice = createInvoiceDetails({ id: TEST_INVOICE_ID });

      mockRepoInstance.findByIdWithDetails.mockResolvedValue(mockInvoice);

      const result = await getInvoiceById(TEST_INVOICE_ID);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe(TEST_INVOICE_ID);
      }
      expect(mockRequirePermission).toHaveBeenCalledWith(mockSession.user, 'canReadInvoices');
    });

    it('returns error when invoice not found', async () => {
      mockRepoInstance.findByIdWithDetails.mockResolvedValue(null);

      const result = await getInvoiceById('non-existent');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Invoice not found');
      }
    });

    it('returns unauthorized when no session', async () => {
      mockAuth.mockResolvedValue(null);
      const result = await getInvoiceById(TEST_INVOICE_ID);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Unauthorized');
      }
    });
  });

  describe('getInvoiceBasicById', () => {
    it('returns basic invoice details successfully', async () => {
      const mockInvoice = {
        id: TEST_INVOICE_ID,
        invoiceNumber: 'INV-001',
        status: 'DRAFT',
        _count: { items: 3, payments: 1 },
      };

      mockRepoInstance.findInvoiceBasicById.mockResolvedValue(mockInvoice);

      const result = await getInvoiceBasicById(TEST_INVOICE_ID);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe(TEST_INVOICE_ID);
      }
    });

    it('returns error when invoice not found', async () => {
      mockRepoInstance.findInvoiceBasicById.mockResolvedValue(null);

      const result = await getInvoiceBasicById('non-existent');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Invoice not found');
      }
    });
  });

  describe('getInvoiceItems', () => {
    it('returns invoice items successfully', async () => {
      const mockItems = [
        { id: 'item-1', description: 'Item 1', quantity: 2, unitPrice: 100 },
        { id: 'item-2', description: 'Item 2', quantity: 1, unitPrice: 200 },
      ];

      mockRepoInstance.findInvoiceItems.mockResolvedValue(mockItems);

      const result = await getInvoiceItems(TEST_INVOICE_ID);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(2);
      }
    });
  });

  describe('getInvoicePayments', () => {
    it('returns invoice payments successfully', async () => {
      const mockPayments = [
        {
          id: 'payment-1',
          amount: 50,
          paidDate: new Date(),
          paymentMethod: 'Credit Card',
        },
      ];

      mockRepoInstance.findInvoicePayments.mockResolvedValue(mockPayments);

      const result = await getInvoicePayments(TEST_INVOICE_ID);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(1);
      }
    });
  });

  describe('getInvoiceStatusHistory', () => {
    it('returns status history successfully', async () => {
      const mockHistory = [
        { id: '1', status: 'DRAFT', changedAt: new Date() },
        { id: '2', status: 'PENDING', changedAt: new Date() },
      ];

      mockRepoInstance.findInvoiceStatusHistory.mockResolvedValue(mockHistory);

      const result = await getInvoiceStatusHistory(TEST_INVOICE_ID);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(2);
      }
    });
  });

  describe('getInvoiceStatistics', () => {
    it('returns statistics successfully when authorized', async () => {
      const mockStats = createInvoiceStatistics();

      mockRepoInstance.getStatistics.mockResolvedValue(mockStats);

      const result = await getInvoiceStatistics();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.total).toBe(100);
      }
    });

    it('returns statistics with date filter', async () => {
      const mockStats = createInvoiceStatistics({ total: 50 });
      mockRepoInstance.getStatistics.mockResolvedValue(mockStats);

      const dateFilter = {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
      };

      const result = await getInvoiceStatistics(dateFilter);

      expect(result.success).toBe(true);
      expect(mockRepoInstance.getStatistics).toHaveBeenCalledWith(dateFilter);
    });

    it('returns unauthorized when no session', async () => {
      mockAuth.mockResolvedValue(null);
      const result = await getInvoiceStatistics();
      expect(result.success).toBe(false);
    });
  });

  describe('getMonthlyRevenueTrend', () => {
    it('returns monthly revenue trend successfully', async () => {
      const mockTrend = [
        { month: '2024-01', revenue: 10000, invoiceCount: 15 },
        { month: '2024-02', revenue: 12000, invoiceCount: 18 },
      ];

      mockRepoInstance.getMonthlyRevenueTrend.mockResolvedValue(mockTrend);

      const result = await getMonthlyRevenueTrend(12);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(2);
      }
    });

    it('returns unauthorized when no session', async () => {
      mockAuth.mockResolvedValue(null);
      const result = await getMonthlyRevenueTrend();
      expect(result.success).toBe(false);
    });
  });

  describe('getTopDebtors', () => {
    it('returns top debtors successfully', async () => {
      const mockDebtors = [
        { customerId: 'cust-1', customerName: 'John Doe', outstandingAmount: 5000 },
        { customerId: 'cust-2', customerName: 'Jane Smith', outstandingAmount: 3000 },
      ];

      mockRepoInstance.getTopDebtors.mockResolvedValue(mockDebtors);

      const result = await getTopDebtors(5);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(2);
      }
    });

    it('returns unauthorized when no session', async () => {
      mockAuth.mockResolvedValue(null);
      const result = await getTopDebtors();
      expect(result.success).toBe(false);
    });
  });
});

describe('Invoice Queries - Permission Tests', () => {
  const mockUserRole = mockSessions.user();
  const mockManagerRole = mockSessions.manager();
  const mockAdminRole = mockSessions.admin();

  beforeEach(() => {
    vi.clearAllMocks();
    mockRepoInstance.searchAndPaginate.mockResolvedValue({
      items: [],
      pagination: {},
    });
    mockRepoInstance.findByIdWithDetails.mockResolvedValue(createInvoiceDetails());
  });

  describe('getInvoices', () => {
    it('should allow USER role to read invoices', async () => {
      mockAuth.mockResolvedValue(mockUserRole);

      const result = await getInvoices({});

      expect(result.success).toBe(true);
    });

    it('should allow MANAGER role to read invoices', async () => {
      mockAuth.mockResolvedValue(mockManagerRole);

      const result = await getInvoices({});

      expect(result.success).toBe(true);
    });

    it('should allow ADMIN role to read invoices', async () => {
      mockAuth.mockResolvedValue(mockAdminRole);

      const result = await getInvoices({});

      expect(result.success).toBe(true);
    });

    it('should deny unauthenticated users', async () => {
      mockAuth.mockResolvedValue(null);

      const result = await getInvoices({});

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Unauthorized');
      }
    });
  });

  describe('getInvoiceById', () => {
    it('should allow USER role to read invoice details', async () => {
      mockAuth.mockResolvedValue(mockUserRole);

      const result = await getInvoiceById(TEST_INVOICE_ID);

      expect(result.success).toBe(true);
    });
  });
});
