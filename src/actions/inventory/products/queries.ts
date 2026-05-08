'use server';

import { prisma } from '@/lib/prisma';
import { handleActionError } from '@/lib/error-handler';
import { withTenantPermission } from '@/lib/action-auth';
import { ProductRepository } from '@/repositories/product-repository';
import type {
  ProductFilters,
  ProductPagination,
  ProductWithDetails,
  ProductStatistics
} from '@/features/inventory/products/types';

const productRepo = new ProductRepository(prisma);

/**
 * Retrieves a paginated list of products based on specified filter criteria.
 * @param filters - The parsed filter criteria for filtering, sorting, and pagination.
 * @returns A promise that resolves to an `ActionResult` containing the paginated product data.
 */
export const getProducts = withTenantPermission<ProductFilters, ProductPagination>(
  'canReadProducts',
  async (ctx, filters) => {
    try {
      const result = await productRepo.searchProducts(filters, ctx.tenantId);

      return { success: true, data: result };
    } catch (error) {
      return handleActionError(error, 'Failed to fetch products');
    }
  }
);

/**
 * Retrieves a single product by ID with full details.
 * Includes all product fields, pricing, and stock levels.
 * @param id - The unique identifier of the product to retrieve.
 * @returns A promise that resolves to an `ActionResult` containing the product details,
 * or an error if the product is not found.
 */
export const getProductById = withTenantPermission<string, ProductWithDetails>(
  'canReadProducts',
  async (ctx, id) => {
    try {
      const product = await productRepo.findProductById(id, ctx.tenantId);

      if (!product) {
        return { success: false, error: 'Product not found' };
      }

      return { success: true, data: product };
    } catch (error) {
      return handleActionError(error, 'Failed to fetch product');
    }
  }
);

/**
 * Retrieves aggregated product statistics for dashboard displays.
 * Returns counts and metrics including total, active, and low stock products.
 * @returns A promise that resolves to an `ActionResult` containing the product statistics.
 */
export const getProductStatistics = withTenantPermission<void, ProductStatistics>(
  'canReadProducts',
  async (ctx) => {
    try {
      const stats = await productRepo.getProductStatistics(ctx.tenantId);
      return { success: true, data: stats };
    } catch (error) {
      return handleActionError(error, 'Failed to fetch product statistics');
    }
  }
);

/**
 * Retrieves all active products for dropdown selections.
 * Returns a lightweight list with only essential fields (id, name, price).
 * @returns A promise that resolves to an `ActionResult` containing an array of active products.
 */
export const getActiveProducts = withTenantPermission<
  void,
  Array<{ id: string; name: string; price: number }>
>('canReadProducts', async (ctx) => {
  try {
    const products = await productRepo.getActiveProducts(ctx.tenantId);
    return { success: true, data: products };
  } catch (error) {
    return handleActionError(error, 'Failed to fetch active products');
  }
});
