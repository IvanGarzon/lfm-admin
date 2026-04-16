'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { handleActionError } from '@/lib/error-handler';
import { withTenantPermission } from '@/lib/action-auth';
import {
  CreateProductSchema,
  UpdateProductSchema,
  DeleteProductSchema,
  UpdateProductStatusSchema,
  UpdateProductStockSchema,
  BulkUpdateProductStatusSchema,
  BulkDeleteProductsSchema,
  type CreateProductInput,
  type UpdateProductInput,
  type DeleteProductInput,
  type UpdateProductStatusInput,
  type UpdateProductStockInput,
  type BulkUpdateProductStatusInput,
  type BulkDeleteProductsInput,
} from '@/schemas/products';
import { ProductRepository } from '@/repositories/product-repository';

const PRODUCTS_PATH = '/inventory/products';

const productRepo = new ProductRepository(prisma);

// -- Actions ---------------------------------------------------------------

/**
 * Creates a new product for the current tenant.
 * @param data - The product creation input including name, price, stock, and status.
 * @returns An `ActionResult` containing the new product ID, or an error.
 */
export const createProduct = withTenantPermission<CreateProductInput, { id: string }>(
  'canManageProducts',
  async (ctx, data) => {
    try {
      const validatedData = CreateProductSchema.parse(data);

      const result = await productRepo.createProduct(validatedData, ctx.tenantId);
      revalidatePath(PRODUCTS_PATH);

      return { success: true, data: result };
    } catch (error) {
      return handleActionError(error, 'Failed to create product');
    }
  },
);

/**
 * Updates an existing product by ID.
 * @param data - The update input including the product ID and fields to update.
 * @returns An `ActionResult` containing the updated product ID, or an error.
 */
export const updateProduct = withTenantPermission<UpdateProductInput, { id: string }>(
  'canManageProducts',
  async (ctx, data) => {
    try {
      const validatedData = UpdateProductSchema.parse(data);
      const result = await productRepo.updateProduct(validatedData.id, ctx.tenantId, validatedData);

      if (!result) {
        return { success: false, error: 'Product not found' };
      }

      revalidatePath(PRODUCTS_PATH);
      revalidatePath(`${PRODUCTS_PATH}/${validatedData.id}`);
      return { success: true, data: { id: result.id } };
    } catch (error) {
      return handleActionError(error, 'Failed to update product');
    }
  },
);

/**
 * Permanently deletes a product by ID.
 * Deletion is blocked if the product is referenced in any invoices or quotes.
 * @param data - Object containing the product ID to delete.
 * @returns An `ActionResult` indicating success, or an error.
 */
export const deleteProduct = withTenantPermission<DeleteProductInput, { success: boolean }>(
  'canManageProducts',
  async (ctx, data) => {
    try {
      const { id } = DeleteProductSchema.parse(data);
      const deleted = await productRepo.deleteProduct(id, ctx.tenantId);

      if (!deleted) {
        return { success: false, error: 'Product not found' };
      }

      revalidatePath(PRODUCTS_PATH);
      return { success: true, data: { success: true } };
    } catch (error) {
      return handleActionError(error, 'Failed to delete product');
    }
  },
);

/**
 * Updates the status of a single product.
 * @param data - Object containing the product ID and the new status.
 * @returns An `ActionResult` containing the product ID, or an error.
 */
export const updateProductStatus = withTenantPermission<UpdateProductStatusInput, { id: string }>(
  'canManageProducts',
  async (ctx, { id, status }) => {
    try {
      const validatedData = UpdateProductStatusSchema.parse({ id, status });
      const result = await productRepo.updateProductStatus(
        validatedData.id,
        ctx.tenantId,
        validatedData.status,
      );

      if (!result) {
        return { success: false, error: 'Product not found' };
      }

      revalidatePath(PRODUCTS_PATH);
      revalidatePath(`${PRODUCTS_PATH}/${id}`);
      return { success: true, data: { id: result.id } };
    } catch (error) {
      return handleActionError(error, 'Failed to update product status');
    }
  },
);

/**
 * Updates the stock level of a product by a given quantity delta.
 * Passing a negative quantity decrements stock; a positive value increments it.
 * Automatically transitions status to OUT_OF_STOCK or ACTIVE based on the result.
 * @param data - Object containing the product ID and the quantity adjustment.
 * @returns An `ActionResult` containing the product ID and new stock level, or an error.
 */
export const updateProductStock = withTenantPermission<
  UpdateProductStockInput,
  { id: string; stock: number }
>('canManageProducts', async (ctx, { id, quantity }) => {
  try {
    const validatedData = UpdateProductStockSchema.parse({ id, quantity });
    const result = await productRepo.updateProductStock(
      validatedData.id,
      ctx.tenantId,
      validatedData.quantity,
    );

    if (!result) {
      return { success: false, error: 'Product not found' };
    }

    revalidatePath(PRODUCTS_PATH);
    revalidatePath(`${PRODUCTS_PATH}/${id}`);
    return { success: true, data: { id: result.id, stock: result.stock } };
  } catch (error) {
    return handleActionError(error, 'Failed to update product stock');
  }
});

/**
 * Updates the status for multiple products in a single operation.
 * @param data - Object containing an array of product IDs and the new status.
 * @returns An `ActionResult` containing the count of updated products, or an error.
 */
export const bulkUpdateProductStatus = withTenantPermission<
  BulkUpdateProductStatusInput,
  { count: number }
>('canManageProducts', async (ctx, { ids, status }) => {
  try {
    const validatedData = BulkUpdateProductStatusSchema.parse({ ids, status });
    const count = await productRepo.bulkUpdateProductStatus(
      validatedData.ids,
      ctx.tenantId,
      validatedData.status,
    );

    revalidatePath(PRODUCTS_PATH);
    return { success: true, data: { count } };
  } catch (error) {
    return handleActionError(error, 'Failed to update products');
  }
});

/**
 * Permanently deletes multiple products.
 * Products referenced in invoices or quotes are skipped automatically.
 * Throws if all selected products are in use.
 * @param ids - Array of product IDs to delete.
 * @returns An `ActionResult` containing the count of deleted products, or an error.
 */
export const bulkDeleteProducts = withTenantPermission<BulkDeleteProductsInput, { count: number }>(
  'canManageProducts',
  async (ctx, data) => {
    try {
      const { ids } = BulkDeleteProductsSchema.parse(data);
      const count = await productRepo.bulkDeleteProducts(ids, ctx.tenantId);

      revalidatePath(PRODUCTS_PATH);
      return { success: true, data: { count } };
    } catch (error) {
      return handleActionError(error, 'Failed to delete products');
    }
  },
);
