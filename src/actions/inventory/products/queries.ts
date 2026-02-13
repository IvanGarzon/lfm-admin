'use server';

import { auth } from '@/auth';
import { handleActionError } from '@/lib/error-handler';
import { requirePermission } from '@/lib/permissions';
import { ProductFiltersSchema } from '@/schemas/products';
import {
  productRepo,
  type ProductPagination,
  type ProductWithDetails,
  type ProductStatistics,
} from '@/repositories/product-repository';
import type { ActionResult } from '@/types/actions';
import type { SearchParams } from 'nuqs/server';

/**
 * Get paginated list of products with filters
 */
export async function getProducts(
  searchParams: SearchParams,
): Promise<ActionResult<ProductPagination>> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    requirePermission(session.user, 'canReadProducts');

    // Parse and validate filters
    const filters = ProductFiltersSchema.parse({
      search: searchParams.search ?? '',
      status: searchParams.status
        ? Array.isArray(searchParams.status)
          ? searchParams.status
          : [searchParams.status]
        : undefined,
      page: searchParams.page ? Number(searchParams.page) : 1,
      perPage: searchParams.perPage ? Number(searchParams.perPage) : 20,
      sort: searchParams.sort ? JSON.parse(searchParams.sort as string) : undefined,
    });

    const result = await productRepo.searchAndPaginate(filters);
    return { success: true, data: result };
  } catch (error) {
    return handleActionError(error, 'Failed to fetch products');
  }
}

/**
 * Get a single product by ID with details
 */
export async function getProductById(id: string): Promise<ActionResult<ProductWithDetails>> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    requirePermission(session.user, 'canReadProducts');
    const product = await productRepo.findByIdWithDetails(id);

    if (!product) {
      return { success: false, error: 'Product not found' };
    }

    return { success: true, data: product };
  } catch (error) {
    return handleActionError(error, 'Failed to fetch product');
  }
}

/**
 * Get product statistics
 */
export async function getProductStatistics(): Promise<ActionResult<ProductStatistics>> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    requirePermission(session.user, 'canReadProducts');
    const stats = await productRepo.getStatistics();
    return { success: true, data: stats };
  } catch (error) {
    return handleActionError(error, 'Failed to fetch product statistics');
  }
}

/**
 * Get active products for dropdown selections
 */
export async function getActiveProducts(): Promise<
  ActionResult<Array<{ id: string; name: string; price: number }>>
> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    requirePermission(session.user, 'canReadProducts');
    const products = await productRepo.getActiveProducts();
    return { success: true, data: products };
  } catch (error) {
    return handleActionError(error, 'Failed to fetch active products');
  }
}
