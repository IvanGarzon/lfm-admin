import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getCustomers, getCustomerById, getActiveCustomers } from '../queries';
import { testIds, mockSessions } from '@/lib/testing';
import type { CustomerListItem, CustomerPagination } from '@/features/crm/customers/types';

const { mockCustomerRepo, mockAuth } = vi.hoisted(() => ({
  mockCustomerRepo: {
    searchCustomers: vi.fn(),
    findCustomerById: vi.fn(),
    findActiveCustomers: vi.fn(),
  },
  mockAuth: vi.fn(),
}));

vi.mock('@/repositories/customer-repository', () => ({
  CustomerRepository: vi.fn().mockImplementation(function () {
    return mockCustomerRepo;
  }),
}));

vi.mock('@/auth', () => ({ auth: mockAuth }));

vi.mock('@/filters/customers/customers-filters', () => ({
  searchParamsCache: {
    parse: vi.fn().mockReturnValue({ page: 1, perPage: 10 }),
  },
}));

const TEST_CUSTOMER_ID = testIds.customer();

const mockCustomer: CustomerListItem = {
  id: TEST_CUSTOMER_ID,
  firstName: 'Jane',
  lastName: 'Smith',
  email: 'jane@example.com',
  phone: null,
  gender: 'FEMALE',
  status: 'ACTIVE',
  organizationId: null,
  organizationName: null,
  useOrganizationAddress: false,
  address: null,
  createdAt: new Date('2024-01-01'),
  deletedAt: null,
  invoicesCount: 0,
  quotesCount: 0,
};

const mockPagination: CustomerPagination = {
  items: [mockCustomer],
  pagination: {
    totalItems: 1,
    totalPages: 1,
    currentPage: 1,
    hasNextPage: false,
    hasPreviousPage: false,
    nextPage: null,
    previousPage: null,
  },
};

describe('Customer Queries', () => {
  const mockSession = mockSessions.manager();

  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue(mockSession);
  });

  describe('getCustomers', () => {
    it('returns paginated customers', async () => {
      mockCustomerRepo.searchCustomers.mockResolvedValue(mockPagination);

      const result = await getCustomers({});

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.items).toHaveLength(1);
        expect(result.data.items[0].id).toBe(TEST_CUSTOMER_ID);
      }
      expect(mockCustomerRepo.searchCustomers).toHaveBeenCalledWith(
        expect.objectContaining({ page: 1, perPage: 10 }),
        mockSession.user.tenantId,
      );
    });

    it('returns unauthorized when not signed in', async () => {
      mockAuth.mockResolvedValue(null);

      const result = await getCustomers({});

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toMatch(/signed in/i);
      }
    });
  });

  describe('getCustomerById', () => {
    it('returns a customer when found', async () => {
      mockCustomerRepo.findCustomerById.mockResolvedValue(mockCustomer);

      const result = await getCustomerById(TEST_CUSTOMER_ID);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data?.id).toBe(TEST_CUSTOMER_ID);
      }
      expect(mockCustomerRepo.findCustomerById).toHaveBeenCalledWith(
        TEST_CUSTOMER_ID,
        mockSession.user.tenantId,
      );
    });

    it('returns error when customer not found', async () => {
      mockCustomerRepo.findCustomerById.mockResolvedValue(null);

      const result = await getCustomerById(TEST_CUSTOMER_ID);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toMatch(/not found/i);
      }
    });
  });

  describe('getActiveCustomers', () => {
    it('returns active customers for selection', async () => {
      const selectItems = [
        { id: TEST_CUSTOMER_ID, firstName: 'Jane', lastName: 'Smith', email: 'jane@example.com' },
      ];
      mockCustomerRepo.findActiveCustomers.mockResolvedValue(selectItems);

      const result = await getActiveCustomers();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(1);
      }
      expect(mockCustomerRepo.findActiveCustomers).toHaveBeenCalledWith(mockSession.user.tenantId);
    });
  });
});
