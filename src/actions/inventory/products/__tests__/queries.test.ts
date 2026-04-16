import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getProducts, getProductById, getProductStatistics, getActiveProducts } from '../queries';
import {
  testIds,
  mockSessions,
  createProductWithDetails,
  createProductStatistics,
} from '@/lib/testing';

const { mockProductRepo, mockAuth } = vi.hoisted(() => ({
  mockProductRepo: {
    searchProducts: vi.fn(),
    findProductById: vi.fn(),
    getProductStatistics: vi.fn(),
    getActiveProducts: vi.fn(),
  },
  mockAuth: vi.fn(),
}));

vi.mock('@/repositories/product-repository', () => ({
  ProductRepository: vi.fn().mockImplementation(function () {
    return mockProductRepo;
  }),
}));

vi.mock('@/auth', () => ({
  auth: mockAuth,
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {},
}));

const TEST_PRODUCT_ID = testIds.product();
const unauthorizedError = 'You must be signed in to perform this action';

describe('Product Queries', () => {
  const mockSession = mockSessions.manager();

  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue(mockSession);
  });

  describe('getProducts', () => {
    it('returns paginated products when authorised', async () => {
      const mockResult = {
        items: [createProductWithDetails({ id: 'p1' }), createProductWithDetails({ id: 'p2' })],
        pagination: { page: 1, perPage: 20, totalItems: 2, totalPages: 1 },
      };
      mockProductRepo.searchProducts.mockResolvedValue(mockResult);

      const result = await getProducts({});

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(mockResult);
      }
      expect(mockProductRepo.searchProducts).toHaveBeenCalledWith(
        expect.objectContaining({ page: 1, perPage: 20 }),
        mockSession.user.tenantId,
      );
    });

    it('returns unauthorised when no session', async () => {
      mockAuth.mockResolvedValue(null);
      const result = await getProducts({});
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe(unauthorizedError);
      }
    });

    it('returns error when repo throws', async () => {
      mockProductRepo.searchProducts.mockRejectedValue(new Error('DB error'));
      const result = await getProducts({});
      expect(result.success).toBe(false);
    });
  });

  describe('getProductById', () => {
    it('returns product details when authorised', async () => {
      const mockProduct = createProductWithDetails({ id: TEST_PRODUCT_ID });
      mockProductRepo.findProductById.mockResolvedValue(mockProduct);

      const result = await getProductById(TEST_PRODUCT_ID);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe(TEST_PRODUCT_ID);
      }
      expect(mockProductRepo.findProductById).toHaveBeenCalledWith(
        TEST_PRODUCT_ID,
        mockSession.user.tenantId,
      );
    });

    it('returns error when product not found', async () => {
      mockProductRepo.findProductById.mockResolvedValue(null);
      const result = await getProductById('non-existent');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Product not found');
      }
    });

    it('returns unauthorised when no session', async () => {
      mockAuth.mockResolvedValue(null);
      const result = await getProductById(TEST_PRODUCT_ID);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe(unauthorizedError);
      }
    });
  });

  describe('getProductStatistics', () => {
    it('returns statistics when authorised', async () => {
      const mockStats = createProductStatistics();
      mockProductRepo.getProductStatistics.mockResolvedValue(mockStats);

      const result = await getProductStatistics();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.totalProducts).toBe(50);
        expect(result.data.activeProducts).toBe(40);
      }
      expect(mockProductRepo.getProductStatistics).toHaveBeenCalledWith(mockSession.user.tenantId);
    });

    it('returns unauthorised when no session', async () => {
      mockAuth.mockResolvedValue(null);
      const result = await getProductStatistics();
      expect(result.success).toBe(false);
    });
  });

  describe('getActiveProducts', () => {
    it('returns active products when authorised', async () => {
      const mockProducts = [
        { id: 'p1', name: 'Rose Bouquet', price: 49.99 },
        { id: 'p2', name: 'Lily Arrangement', price: 35.0 },
      ];
      mockProductRepo.getActiveProducts.mockResolvedValue(mockProducts);

      const result = await getActiveProducts();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(2);
      }
      expect(mockProductRepo.getActiveProducts).toHaveBeenCalledWith(mockSession.user.tenantId);
    });

    it('returns unauthorised when no session', async () => {
      mockAuth.mockResolvedValue(null);
      const result = await getActiveProducts();
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe(unauthorizedError);
      }
    });
  });
});

describe('Product Queries - Permission Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockProductRepo.searchProducts.mockResolvedValue({ items: [], pagination: {} });
  });

  it('allows USER role to read products', async () => {
    mockAuth.mockResolvedValue(mockSessions.user());
    const result = await getProducts({});
    expect(result.success).toBe(true);
  });

  it('allows MANAGER role to read products', async () => {
    mockAuth.mockResolvedValue(mockSessions.manager());
    const result = await getProducts({});
    expect(result.success).toBe(true);
  });

  it('allows ADMIN role to read products', async () => {
    mockAuth.mockResolvedValue(mockSessions.admin());
    const result = await getProducts({});
    expect(result.success).toBe(true);
  });

  it('denies unauthenticated users', async () => {
    mockAuth.mockResolvedValue(null);
    const result = await getProducts({});
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe(unauthorizedError);
    }
  });
});
