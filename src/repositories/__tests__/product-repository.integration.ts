/**
 * ProductRepository Integration Tests
 *
 * Tests the repository against a real Postgres database spun up via
 * Testcontainers. No mocks — every assertion hits an actual DB query.
 *
 * Run with: pnpm test:integration
 */

import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest';
import { ProductStatus } from '@/prisma/client';
import { ProductRepository } from '../product-repository';
import {
  setupTestDatabaseLifecycle,
  getTestPrisma,
  createTestTenant,
} from '@/lib/testing/integration/database';
import { createProductInput } from '@/lib/testing';

// Prevent the module-level singleton from running before the container is ready.
// The test creates its own repository instance via getTestPrisma().
vi.mock('@/lib/prisma', () => ({ prisma: {} }));

setupTestDatabaseLifecycle();

// -- Tests -------------------------------------------------------------------

describe('ProductRepository (integration)', () => {
  let repository: ProductRepository;
  let tenantId: string;

  beforeAll(() => {
    repository = new ProductRepository(getTestPrisma());
  });

  beforeEach(async () => {
    ({ id: tenantId } = await createTestTenant({ name: 'Product Test Tenant' }));
  });

  // -- createProduct ---------------------------------------------------------

  describe('createProduct', () => {
    it('creates a product and returns its ID', async () => {
      const result = await repository.createProduct(createProductInput(), tenantId);

      expect(result.id).toBeDefined();

      const saved = await repository.findProductById(result.id, tenantId);
      expect(saved!.name).toBe('Rose Bouquet');
      expect(saved!.price).toBeCloseTo(49.99);
      expect(saved!.stock).toBe(100);
    });
  });

  // -- findProductById -------------------------------------------------------

  describe('findProductById', () => {
    it('returns a product with relation counts', async () => {
      const { id } = await repository.createProduct(createProductInput(), tenantId);

      const result = await repository.findProductById(id, tenantId);

      expect(result).not.toBeNull();
      expect(result!.id).toBe(id);
      expect(result!._count.invoiceItems).toBe(0);
      expect(result!._count.quoteItems).toBe(0);
    });

    it('returns null for a non-existent ID', async () => {
      const result = await repository.findProductById('cltest000000000000none0001', tenantId);
      expect(result).toBeNull();
    });

    it('returns null when ID belongs to a different tenant', async () => {
      const { id: otherTenantId } = await createTestTenant({ name: 'Isolation Tenant' });
      const { id } = await repository.createProduct(createProductInput(), otherTenantId);

      const result = await repository.findProductById(id, tenantId);
      expect(result).toBeNull();
    });
  });

  // -- searchProducts --------------------------------------------------------

  describe('searchProducts', () => {
    it('returns only products scoped to the tenant', async () => {
      const { id: otherTenantId } = await createTestTenant({ name: 'Other Tenant' });
      await repository.createProduct(createProductInput({ name: 'Rose Bouquet' }), tenantId);
      await repository.createProduct(createProductInput({ name: 'Other Product' }), otherTenantId);

      const result = await repository.searchProducts({ page: 1, perPage: 20 }, tenantId);

      expect(result.pagination.totalItems).toBe(1);
      expect(result.items[0].name).toBe('Rose Bouquet');
    });

    it('filters by search term', async () => {
      await repository.createProduct(createProductInput({ name: 'Rose Bouquet' }), tenantId);
      await repository.createProduct(createProductInput({ name: 'Lily Arrangement' }), tenantId);

      const result = await repository.searchProducts(
        { search: 'rose', page: 1, perPage: 20 },
        tenantId,
      );

      expect(result.items).toHaveLength(1);
      expect(result.items[0].name).toBe('Rose Bouquet');
    });

    it('filters by status', async () => {
      await repository.createProduct(
        createProductInput({ name: 'Active', status: ProductStatus.ACTIVE }),
        tenantId,
      );
      await repository.createProduct(
        createProductInput({ name: 'Inactive', status: ProductStatus.INACTIVE }),
        tenantId,
      );

      const result = await repository.searchProducts(
        { status: [ProductStatus.INACTIVE], page: 1, perPage: 20 },
        tenantId,
      );

      expect(result.items).toHaveLength(1);
      expect(result.items[0].name).toBe('Inactive');
    });

    it('paginates correctly', async () => {
      await repository.createProduct(createProductInput({ name: 'Product A' }), tenantId);
      await repository.createProduct(createProductInput({ name: 'Product B' }), tenantId);
      await repository.createProduct(createProductInput({ name: 'Product C' }), tenantId);

      const result = await repository.searchProducts({ page: 1, perPage: 2 }, tenantId);

      expect(result.items).toHaveLength(2);
      expect(result.pagination.totalItems).toBe(3);
      expect(result.pagination.totalPages).toBe(2);
    });

    it('converts Decimal price to number', async () => {
      await repository.createProduct(createProductInput({ price: 29.99 }), tenantId);

      const result = await repository.searchProducts({ page: 1, perPage: 20 }, tenantId);

      expect(typeof result.items[0].price).toBe('number');
      expect(result.items[0].price).toBeCloseTo(29.99);
    });
  });

  // -- updateProduct ---------------------------------------------------------

  describe('updateProduct', () => {
    it('updates product fields and returns the updated product', async () => {
      const { id } = await repository.createProduct(
        createProductInput({ name: 'Old Name', price: 10 }),
        tenantId,
      );

      const result = await repository.updateProduct(id, tenantId, {
        id,
        name: 'New Name',
        status: ProductStatus.INACTIVE,
        price: 20,
        stock: 5,
        description: 'Updated',
        imageUrl: null,
        availableAt: null,
      });

      expect(result!.name).toBe('New Name');
      expect(result!.price).toBeCloseTo(20);
      expect(result!.status).toBe(ProductStatus.INACTIVE);
    });

    it('does not update a product belonging to another tenant', async () => {
      const { id: otherTenantId } = await createTestTenant({ name: 'Update Isolation Tenant' });
      const { id } = await repository.createProduct(createProductInput(), otherTenantId);

      const result = await repository.updateProduct(id, tenantId, {
        id,
        name: 'Hacked Name',
        status: ProductStatus.ACTIVE,
        price: 1,
        stock: 0,
        description: null,
        imageUrl: null,
        availableAt: null,
      });

      expect(result).toBeNull();
    });
  });

  // -- deleteProduct ---------------------------------------------------------

  describe('deleteProduct', () => {
    it('permanently removes the product', async () => {
      const { id } = await repository.createProduct(createProductInput(), tenantId);

      const deleted = await repository.deleteProduct(id, tenantId);
      expect(deleted).toBe(true);

      const found = await repository.findProductById(id, tenantId);
      expect(found).toBeNull();
    });

    it('returns false for a non-existent ID', async () => {
      const result = await repository.deleteProduct('cltest000000000000none0001', tenantId);
      expect(result).toBe(false);
    });

    it('does not delete a product belonging to another tenant', async () => {
      const { id: otherTenantId } = await createTestTenant({ name: 'Delete Isolation Tenant' });
      const { id } = await repository.createProduct(createProductInput(), otherTenantId);

      const result = await repository.deleteProduct(id, tenantId);
      expect(result).toBe(false);

      const stillExists = await repository.findProductById(id, otherTenantId);
      expect(stillExists).not.toBeNull();
    });
  });

  // -- updateProductStatus ---------------------------------------------------

  describe('updateProductStatus', () => {
    it('updates the status and returns the updated product', async () => {
      const { id } = await repository.createProduct(
        createProductInput({ status: ProductStatus.ACTIVE }),
        tenantId,
      );

      const result = await repository.updateProductStatus(id, tenantId, ProductStatus.INACTIVE);

      expect(result!.status).toBe(ProductStatus.INACTIVE);
    });

    it('returns null for a non-existent ID', async () => {
      const result = await repository.updateProductStatus(
        'cltest000000000000none0001',
        tenantId,
        ProductStatus.INACTIVE,
      );
      expect(result).toBeNull();
    });
  });

  // -- updateProductStock ----------------------------------------------------

  describe('updateProductStock', () => {
    it('increments stock correctly', async () => {
      const { id } = await repository.createProduct(createProductInput({ stock: 50 }), tenantId);

      const result = await repository.updateProductStock(id, tenantId, 10);

      expect(result!.stock).toBe(60);
    });

    it('decrements stock correctly', async () => {
      const { id } = await repository.createProduct(createProductInput({ stock: 50 }), tenantId);

      const result = await repository.updateProductStock(id, tenantId, -10);

      expect(result!.stock).toBe(40);
    });

    it('transitions to OUT_OF_STOCK when stock reaches zero', async () => {
      const { id } = await repository.createProduct(
        createProductInput({ status: ProductStatus.ACTIVE, stock: 5 }),
        tenantId,
      );

      const result = await repository.updateProductStock(id, tenantId, -5);

      expect(result!.stock).toBe(0);
      expect(result!.status).toBe(ProductStatus.OUT_OF_STOCK);
    });

    it('transitions back to ACTIVE when stock increases from zero', async () => {
      const { id } = await repository.createProduct(
        createProductInput({ status: ProductStatus.OUT_OF_STOCK, stock: 0 }),
        tenantId,
      );

      const result = await repository.updateProductStock(id, tenantId, 10);

      expect(result!.stock).toBe(10);
      expect(result!.status).toBe(ProductStatus.ACTIVE);
    });

    it('throws when stock adjustment would go negative', async () => {
      const { id } = await repository.createProduct(createProductInput({ stock: 5 }), tenantId);

      await expect(repository.updateProductStock(id, tenantId, -10)).rejects.toThrow(
        'Insufficient stock',
      );
    });

    it('returns null for a product belonging to another tenant', async () => {
      const { id: otherTenantId } = await createTestTenant({ name: 'Stock Isolation Tenant' });
      const { id } = await repository.createProduct(createProductInput(), otherTenantId);

      const result = await repository.updateProductStock(id, tenantId, 10);
      expect(result).toBeNull();
    });
  });

  // -- bulkUpdateProductStatus -----------------------------------------------

  describe('bulkUpdateProductStatus', () => {
    it('updates all matching products for the tenant', async () => {
      const p1 = await repository.createProduct(
        createProductInput({ status: ProductStatus.ACTIVE }),
        tenantId,
      );
      const p2 = await repository.createProduct(
        createProductInput({ status: ProductStatus.ACTIVE }),
        tenantId,
      );

      const count = await repository.bulkUpdateProductStatus(
        [p1.id, p2.id],
        tenantId,
        ProductStatus.INACTIVE,
      );

      expect(count).toBe(2);

      const r1 = await repository.findProductById(p1.id, tenantId);
      const r2 = await repository.findProductById(p2.id, tenantId);
      expect(r1!.status).toBe(ProductStatus.INACTIVE);
      expect(r2!.status).toBe(ProductStatus.INACTIVE);
    });

    it('does not update products belonging to another tenant', async () => {
      const { id: otherTenantId } = await createTestTenant({ name: 'Bulk Status Isolation' });
      const { id } = await repository.createProduct(createProductInput(), otherTenantId);

      const count = await repository.bulkUpdateProductStatus(
        [id],
        tenantId,
        ProductStatus.INACTIVE,
      );
      expect(count).toBe(0);

      const unchanged = await repository.findProductById(id, otherTenantId);
      expect(unchanged!.status).toBe(ProductStatus.ACTIVE);
    });
  });

  // -- bulkDeleteProducts ----------------------------------------------------

  describe('bulkDeleteProducts', () => {
    it('deletes the specified products for the tenant', async () => {
      const p1 = await repository.createProduct(createProductInput(), tenantId);
      const p2 = await repository.createProduct(createProductInput(), tenantId);

      const count = await repository.bulkDeleteProducts([p1.id, p2.id], tenantId);
      expect(count).toBe(2);

      expect(await repository.findProductById(p1.id, tenantId)).toBeNull();
      expect(await repository.findProductById(p2.id, tenantId)).toBeNull();
    });

    it('does not delete products belonging to another tenant', async () => {
      const { id: otherTenantId } = await createTestTenant({ name: 'Bulk Delete Isolation' });
      const { id } = await repository.createProduct(createProductInput(), otherTenantId);

      const count = await repository.bulkDeleteProducts([id], tenantId);
      expect(count).toBe(0);

      const stillExists = await repository.findProductById(id, otherTenantId);
      expect(stillExists).not.toBeNull();
    });
  });

  // -- getProductStatistics --------------------------------------------------

  describe('getProductStatistics', () => {
    it('returns correct counts per status', async () => {
      await repository.createProduct(
        createProductInput({ status: ProductStatus.ACTIVE }),
        tenantId,
      );
      await repository.createProduct(
        createProductInput({ status: ProductStatus.ACTIVE }),
        tenantId,
      );
      await repository.createProduct(
        createProductInput({ status: ProductStatus.INACTIVE }),
        tenantId,
      );
      await repository.createProduct(
        createProductInput({ status: ProductStatus.OUT_OF_STOCK }),
        tenantId,
      );

      const stats = await repository.getProductStatistics(tenantId);

      expect(stats.totalProducts).toBe(4);
      expect(stats.activeProducts).toBe(2);
      expect(stats.inactiveProducts).toBe(1);
      expect(stats.outOfStockProducts).toBe(1);
    });

    it('returns zero counts for a tenant with no products', async () => {
      const stats = await repository.getProductStatistics(tenantId);

      expect(stats.totalProducts).toBe(0);
      expect(stats.totalValue).toBe(0);
    });

    it('does not count products from other tenants', async () => {
      const { id: otherTenantId } = await createTestTenant({ name: 'Stats Isolation Tenant' });
      await repository.createProduct(createProductInput(), otherTenantId);

      const stats = await repository.getProductStatistics(tenantId);
      expect(stats.totalProducts).toBe(0);
    });
  });

  // -- getActiveProducts -----------------------------------------------------

  describe('getActiveProducts', () => {
    it('returns only active products for the tenant', async () => {
      await repository.createProduct(
        createProductInput({ name: 'Active', status: ProductStatus.ACTIVE, price: 25 }),
        tenantId,
      );
      await repository.createProduct(
        createProductInput({ name: 'Inactive', status: ProductStatus.INACTIVE }),
        tenantId,
      );

      const result = await repository.getActiveProducts(tenantId);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Active');
      expect(typeof result[0].price).toBe('number');
    });

    it('does not return products from other tenants', async () => {
      const { id: otherTenantId } = await createTestTenant({ name: 'Active Isolation Tenant' });
      await repository.createProduct(createProductInput(), otherTenantId);

      const result = await repository.getActiveProducts(tenantId);
      expect(result).toHaveLength(0);
    });
  });
});
