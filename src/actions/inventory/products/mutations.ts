'use server';

import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';
import { handleActionError } from '@/lib/error-handler';
import { requirePermission } from '@/lib/permissions';
import { ProductStatus } from '@/prisma/client';
import {
  CreateProductSchema,
  UpdateProductSchema,
  type CreateProductInput,
  type UpdateProductInput,
} from '@/schemas/products';
import { productRepo } from '@/repositories/product-repository';
import type { ActionResult } from '@/types/actions';

const PRODUCTS_PATH = '/inventory/products';

/**
 * Create a new product
 */
export async function createProduct(
  data: CreateProductInput,
): Promise<ActionResult<{ id: string }>> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    requirePermission(session.user, 'canManageProducts');
    const validatedData = CreateProductSchema.parse(data);

    const result = await productRepo.createProduct(validatedData);
    revalidatePath(PRODUCTS_PATH);

    return { success: true, data: result };
  } catch (error) {
    return handleActionError(error, 'Failed to create product');
  }
}

/**
 * Update an existing product
 */
export async function updateProduct(
  data: UpdateProductInput,
): Promise<ActionResult<{ id: string }>> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    requirePermission(session.user, 'canManageProducts');
    const validatedData = UpdateProductSchema.parse(data);
    const result = await productRepo.updateProduct(validatedData.id, validatedData);

    if (!result) {
      return { success: false, error: 'Product not found' };
    }

    revalidatePath(PRODUCTS_PATH);
    revalidatePath(`${PRODUCTS_PATH}/${validatedData.id}`);
    return { success: true, data: { id: result.id } };
  } catch (error) {
    return handleActionError(error, 'Failed to update product');
  }
}

/**
 * Delete a product
 */
export async function deleteProduct(id: string): Promise<ActionResult<{ success: boolean }>> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    requirePermission(session.user, 'canManageProducts');
    const deleted = await productRepo.deleteProduct(id);

    if (!deleted) {
      return { success: false, error: 'Product not found' };
    }

    revalidatePath(PRODUCTS_PATH);
    return { success: true, data: { success: true } };
  } catch (error) {
    return handleActionError(error, 'Failed to delete product');
  }
}

/**
 * Update product status
 */
export async function updateProductStatus(
  id: string,
  status: ProductStatus,
): Promise<ActionResult<{ id: string }>> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    requirePermission(session.user, 'canManageProducts');
    const result = await productRepo.updateStatus(id, status);

    if (!result) {
      return { success: false, error: 'Product not found' };
    }

    revalidatePath(PRODUCTS_PATH);
    revalidatePath(`${PRODUCTS_PATH}/${id}`);
    return { success: true, data: { id: result.id } };
  } catch (error) {
    return handleActionError(error, 'Failed to update product status');
  }
}

/**
 * Update product stock
 */
export async function updateProductStock(
  id: string,
  quantity: number,
): Promise<ActionResult<{ id: string; stock: number }>> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    requirePermission(session.user, 'canManageProducts');
    const result = await productRepo.updateStock(id, quantity);

    if (!result) {
      return { success: false, error: 'Product not found' };
    }

    revalidatePath(PRODUCTS_PATH);
    revalidatePath(`${PRODUCTS_PATH}/${id}`);
    return { success: true, data: { id: result.id, stock: result.stock } };
  } catch (error) {
    return handleActionError(error, 'Failed to update product stock');
  }
}

/**
 * Bulk update product status
 */
export async function bulkUpdateProductStatus(
  ids: string[],
  status: ProductStatus,
): Promise<ActionResult<{ count: number }>> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    requirePermission(session.user, 'canManageProducts');
    const count = await productRepo.bulkUpdateStatus(ids, status);
    revalidatePath(PRODUCTS_PATH);
    return { success: true, data: { count } };
  } catch (error) {
    return handleActionError(error, 'Failed to update products');
  }
}

/**
 * Bulk delete products
 */
export async function bulkDeleteProducts(ids: string[]): Promise<ActionResult<{ count: number }>> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    requirePermission(session.user, 'canManageProducts');
    const count = await productRepo.bulkDelete(ids);
    revalidatePath(PRODUCTS_PATH);
    return { success: true, data: { count } };
  } catch (error) {
    return handleActionError(error, 'Failed to delete products');
  }
}
