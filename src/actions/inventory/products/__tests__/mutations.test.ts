import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createProduct,
  updateProduct,
  deleteProduct,
  updateProductStatus,
  updateProductStock,
  bulkUpdateProductStatus,
  bulkDeleteProducts,
} from '../mutations';
import { testIds, mockSessions, createProductInput, createProductWithDetails } from '@/lib/testing';

const { mockProductRepo, mockAuth } = vi.hoisted(() => ({
  mockProductRepo: {
    createProduct: vi.fn(),
    updateProduct: vi.fn(),
    deleteProduct: vi.fn(),
    updateProductStatus: vi.fn(),
    updateProductStock: vi.fn(),
    bulkUpdateProductStatus: vi.fn(),
    bulkDeleteProducts: vi.fn(),
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

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

const TEST_PRODUCT_ID = testIds.product();
const unauthorizedError = 'You must be signed in to perform this action';

describe('Product Mutations', () => {
  const mockSession = mockSessions.manager();

  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue(mockSession);
  });

  describe('createProduct', () => {
    it('creates a product when authorised', async () => {
      const input = createProductInput();
      mockProductRepo.createProduct.mockResolvedValue({ id: TEST_PRODUCT_ID });

      const result = await createProduct(input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe(TEST_PRODUCT_ID);
      }
      expect(mockProductRepo.createProduct).toHaveBeenCalledWith(
        expect.objectContaining({ name: input.name }),
        mockSession.user.tenantId,
      );
    });

    it('returns unauthorised when no session', async () => {
      mockAuth.mockResolvedValue(null);
      const result = await createProduct(createProductInput());
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe(unauthorizedError);
      }
    });

    it('returns error when repo throws', async () => {
      mockProductRepo.createProduct.mockRejectedValue(new Error('DB error'));
      const result = await createProduct(createProductInput());
      expect(result.success).toBe(false);
    });
  });

  describe('updateProduct', () => {
    it('updates a product when authorised', async () => {
      const mockProduct = createProductWithDetails({ id: TEST_PRODUCT_ID });
      mockProductRepo.updateProduct.mockResolvedValue(mockProduct);

      const input = { ...createProductInput(), id: TEST_PRODUCT_ID };
      const result = await updateProduct(input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe(TEST_PRODUCT_ID);
      }
      expect(mockProductRepo.updateProduct).toHaveBeenCalledWith(
        TEST_PRODUCT_ID,
        mockSession.user.tenantId,
        expect.objectContaining({ name: input.name }),
      );
    });

    it('returns error when product not found', async () => {
      mockProductRepo.updateProduct.mockResolvedValue(null);
      const result = await updateProduct({ ...createProductInput(), id: TEST_PRODUCT_ID });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Product not found');
      }
    });

    it('returns unauthorised when no session', async () => {
      mockAuth.mockResolvedValue(null);
      const result = await updateProduct({ ...createProductInput(), id: TEST_PRODUCT_ID });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe(unauthorizedError);
      }
    });
  });

  describe('deleteProduct', () => {
    it('deletes a product when authorised', async () => {
      mockProductRepo.deleteProduct.mockResolvedValue(true);

      const result = await deleteProduct({ id: TEST_PRODUCT_ID });

      expect(result.success).toBe(true);
      expect(mockProductRepo.deleteProduct).toHaveBeenCalledWith(
        TEST_PRODUCT_ID,
        mockSession.user.tenantId,
      );
    });

    it('returns error when product not found', async () => {
      mockProductRepo.deleteProduct.mockResolvedValue(false);
      const result = await deleteProduct({ id: TEST_PRODUCT_ID });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Product not found');
      }
    });

    it('returns error when product is in use', async () => {
      mockProductRepo.deleteProduct.mockRejectedValue(
        new Error('Cannot delete product that is used in invoices or quotes.'),
      );
      const result = await deleteProduct({ id: TEST_PRODUCT_ID });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Cannot delete product');
      }
    });

    it('returns unauthorised when no session', async () => {
      mockAuth.mockResolvedValue(null);
      const result = await deleteProduct({ id: TEST_PRODUCT_ID });
      expect(result.success).toBe(false);
    });
  });

  describe('updateProductStatus', () => {
    it('updates product status when authorised', async () => {
      const mockProduct = createProductWithDetails({ id: TEST_PRODUCT_ID, status: 'INACTIVE' });
      mockProductRepo.updateProductStatus.mockResolvedValue(mockProduct);

      const result = await updateProductStatus({ id: TEST_PRODUCT_ID, status: 'INACTIVE' });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe(TEST_PRODUCT_ID);
      }
      expect(mockProductRepo.updateProductStatus).toHaveBeenCalledWith(
        TEST_PRODUCT_ID,
        mockSession.user.tenantId,
        'INACTIVE',
      );
    });

    it('returns error when product not found', async () => {
      mockProductRepo.updateProductStatus.mockResolvedValue(null);
      const result = await updateProductStatus({ id: TEST_PRODUCT_ID, status: 'INACTIVE' });
      expect(result.success).toBe(false);
    });

    it('returns unauthorised when no session', async () => {
      mockAuth.mockResolvedValue(null);
      const result = await updateProductStatus({ id: TEST_PRODUCT_ID, status: 'INACTIVE' });
      expect(result.success).toBe(false);
    });
  });

  describe('updateProductStock', () => {
    it('updates product stock when authorised', async () => {
      const mockProduct = createProductWithDetails({ id: TEST_PRODUCT_ID, stock: 110 });
      mockProductRepo.updateProductStock.mockResolvedValue(mockProduct);

      const result = await updateProductStock({ id: TEST_PRODUCT_ID, quantity: 10 });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe(TEST_PRODUCT_ID);
        expect(result.data.stock).toBe(110);
      }
      expect(mockProductRepo.updateProductStock).toHaveBeenCalledWith(
        TEST_PRODUCT_ID,
        mockSession.user.tenantId,
        10,
      );
    });

    it('returns error when stock adjustment would go negative', async () => {
      mockProductRepo.updateProductStock.mockRejectedValue(new Error('Insufficient stock'));
      const result = await updateProductStock({ id: TEST_PRODUCT_ID, quantity: -9999 });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Insufficient stock');
      }
    });

    it('returns unauthorised when no session', async () => {
      mockAuth.mockResolvedValue(null);
      const result = await updateProductStock({ id: TEST_PRODUCT_ID, quantity: 10 });
      expect(result.success).toBe(false);
    });
  });

  describe('bulkUpdateProductStatus', () => {
    it('bulk updates product statuses when authorised', async () => {
      const ids = [TEST_PRODUCT_ID, testIds.product(), testIds.product()];
      mockProductRepo.bulkUpdateProductStatus.mockResolvedValue(3);

      const result = await bulkUpdateProductStatus({ ids, status: 'INACTIVE' });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.count).toBe(3);
      }
      expect(mockProductRepo.bulkUpdateProductStatus).toHaveBeenCalledWith(
        ids,
        mockSession.user.tenantId,
        'INACTIVE',
      );
    });

    it('returns unauthorised when no session', async () => {
      mockAuth.mockResolvedValue(null);
      const result = await bulkUpdateProductStatus({ ids: [TEST_PRODUCT_ID], status: 'INACTIVE' });
      expect(result.success).toBe(false);
    });
  });

  describe('bulkDeleteProducts', () => {
    it('bulk deletes products when authorised', async () => {
      const ids = [TEST_PRODUCT_ID, testIds.product()];
      mockProductRepo.bulkDeleteProducts.mockResolvedValue(2);

      const result = await bulkDeleteProducts({ ids });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.count).toBe(2);
      }
      expect(mockProductRepo.bulkDeleteProducts).toHaveBeenCalledWith(
        ids,
        mockSession.user.tenantId,
      );
    });

    it('returns error when all products are in use', async () => {
      mockProductRepo.bulkDeleteProducts.mockRejectedValue(
        new Error('Selection cannot be deleted as all products are used in invoices or quotes.'),
      );
      const result = await bulkDeleteProducts({ ids: [TEST_PRODUCT_ID] });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Selection cannot be deleted');
      }
    });

    it('returns unauthorised when no session', async () => {
      mockAuth.mockResolvedValue(null);
      const result = await bulkDeleteProducts({ ids: [TEST_PRODUCT_ID] });
      expect(result.success).toBe(false);
    });
  });
});

describe('Product Mutations - Permission Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockProductRepo.createProduct.mockResolvedValue({ id: TEST_PRODUCT_ID });
  });

  it('allows ADMIN role to create products', async () => {
    mockAuth.mockResolvedValue(mockSessions.admin());
    const result = await createProduct(createProductInput());
    expect(result.success).toBe(true);
  });

  it('allows MANAGER role to create products', async () => {
    mockAuth.mockResolvedValue(mockSessions.manager());
    const result = await createProduct(createProductInput());
    expect(result.success).toBe(true);
  });

  it('denies unauthenticated users', async () => {
    mockAuth.mockResolvedValue(null);
    const result = await createProduct(createProductInput());
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe(unauthorizedError);
    }
  });
});
