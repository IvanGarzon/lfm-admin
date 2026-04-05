'use server';

import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';
import { handleActionError } from '@/lib/error-handler';
import { requirePermission } from '@/lib/permissions';
import { withTenantPermission } from '@/lib/action-auth';
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
 * Creates a new product with the provided data.
 * Validates input and creates a new product record in the database.
 * @param data - The input data for creating the product, conforming to `CreateProductInput`.
 * @returns A promise that resolves to an `ActionResult` with the new product's ID.
 */
export const createProduct = withTenantPermission<CreateProductInput, { id: string }>(
  'canManageProducts',
  async (session, data) => {
    try {
      const validatedData = CreateProductSchema.parse(data);

      const result = await productRepo.createProduct(validatedData, session.user.tenantId);
      revalidatePath(PRODUCTS_PATH);

      return { success: true, data: result };
    } catch (error) {
      return handleActionError(error, 'Failed to create product');
    }
  },
);

/**
 * Updates an existing product with the provided data.
 * Validates input and updates the product record in the database.
 * @param data - The input data for updating the product, conforming to `UpdateProductInput`.
 * @returns A promise that resolves to an `ActionResult` with the updated product's ID.
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
 * Deletes a product from the system.
 * Removes the product record from the database.
 * @param id - The unique identifier of the product to delete.
 * @returns A promise that resolves to an `ActionResult` with success status.
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
 * Updates the status of a single product.
 * Changes the product status without modifying other fields.
 * @param id - The unique identifier of the product to update.
 * @param status - The new status (ACTIVE, INACTIVE, or DISCONTINUED).
 * @returns A promise that resolves to an `ActionResult` with the product's ID.
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
 * Updates the stock quantity for a single product.
 * Directly sets the stock level to the specified quantity.
 * @param id - The unique identifier of the product to update.
 * @param quantity - The new stock quantity.
 * @returns A promise that resolves to an `ActionResult` with the product's ID and new stock level.
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
 * Updates the status of multiple products in a single operation.
 * Efficiently updates the status for a batch of products.
 * @param ids - Array of product IDs to update.
 * @param status - The new status to apply to all products.
 * @returns A promise that resolves to an `ActionResult` with the count of updated products.
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
 * Deletes multiple products in a single operation.
 * Efficiently removes a batch of products from the database.
 * @param ids - Array of product IDs to delete.
 * @returns A promise that resolves to an `ActionResult` with the count of deleted products.
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
