'use server';

import { revalidatePath } from 'next/cache';
import { handleActionError } from '@/lib/error-handler';
import { withTenantPermission } from '@/lib/action-auth';
import { ProductStatus } from '@/prisma/client';
import {
  CreateProductSchema,
  UpdateProductSchema,
  type CreateProductInput,
  type UpdateProductInput,
} from '@/schemas/products';
import { productRepo } from '@/repositories/product-repository';

const PRODUCTS_PATH = '/inventory/products';

// -- Input Types -----------------------------------------------------------

type UpdateProductStatusInput = { id: string; status: ProductStatus };
type UpdateProductStockInput = { id: string; quantity: number };
type BulkUpdateProductStatusInput = { ids: string[]; status: ProductStatus };

// -- Actions ---------------------------------------------------------------

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

export const updateProduct = withTenantPermission<UpdateProductInput, { id: string }>(
  'canManageProducts',
  async (_ctx, data) => {
    try {
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
  },
);

export const deleteProduct = withTenantPermission<string, { success: boolean }>(
  'canManageProducts',
  async (_ctx, id) => {
    try {
      const deleted = await productRepo.deleteProduct(id);

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

export const updateProductStatus = withTenantPermission<UpdateProductStatusInput, { id: string }>(
  'canManageProducts',
  async (_ctx, { id, status }) => {
    try {
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
  },
);

export const updateProductStock = withTenantPermission<
  UpdateProductStockInput,
  { id: string; stock: number }
>('canManageProducts', async (_ctx, { id, quantity }) => {
  try {
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
});

export const bulkUpdateProductStatus = withTenantPermission<
  BulkUpdateProductStatusInput,
  { count: number }
>('canManageProducts', async (_ctx, { ids, status }) => {
  try {
    const count = await productRepo.bulkUpdateStatus(ids, status);
    revalidatePath(PRODUCTS_PATH);
    return { success: true, data: { count } };
  } catch (error) {
    return handleActionError(error, 'Failed to update products');
  }
});

export const bulkDeleteProducts = withTenantPermission<string[], { count: number }>(
  'canManageProducts',
  async (_ctx, ids) => {
    try {
      const count = await productRepo.bulkDelete(ids);
      revalidatePath(PRODUCTS_PATH);
      return { success: true, data: { count } };
    } catch (error) {
      return handleActionError(error, 'Failed to delete products');
    }
  },
);
