'use server';

import { revalidatePath } from 'next/cache';
import { handleActionError } from '@/lib/error-handler';
import { withTenantPermission } from '@/lib/action-auth';
import {
  CreatePriceListItemSchema,
  UpdatePriceListItemSchema,
  type CreatePriceListItemInput,
  type UpdatePriceListItemInput,
} from '@/schemas/price-list';
import { priceListRepo } from '@/repositories/price-list-repository';

const PRICE_LIST_PATH = '/inventory/price-list';

/**
 * Creates a new price list item with the provided data.
 * Validates input and creates a new item record with calculated cost.
 * @param data - The input data for creating the item.
 * @returns A promise that resolves to an `ActionResult` with the new item's ID.
 */
export const createPriceListItem = withTenantPermission<CreatePriceListItemInput, { id: string }>(
  'canManagePriceList',
  async (ctx, data) => {
    try {
      const validatedData = CreatePriceListItemSchema.parse(data);

      const result = await priceListRepo.createItem(validatedData, ctx.tenantId);
      revalidatePath(PRICE_LIST_PATH);

      return { success: true, data: result };
    } catch (error) {
      return handleActionError(error, 'Failed to create price list item');
    }
  },
);

/**
 * Updates an existing price list item with the provided data.
 * Validates input and recalculates cost, recording cost history if changed.
 * @param data - The input data for updating the item.
 * @returns A promise that resolves to an `ActionResult` with the item's ID.
 */
export const updatePriceListItem = withTenantPermission<UpdatePriceListItemInput, { id: string }>(
  'canManagePriceList',
  async (_session, data) => {
    try {
      const validatedData = UpdatePriceListItemSchema.parse(data);
      const result = await priceListRepo.updateItem(validatedData.id, validatedData);

      if (!result) {
        return { success: false, error: 'Price list item not found' };
      }

      revalidatePath(PRICE_LIST_PATH);
      revalidatePath(`${PRICE_LIST_PATH}/${validatedData.id}`);
      return { success: true, data: { id: result.id } };
    } catch (error) {
      return handleActionError(error, 'Failed to update price list item');
    }
  },
);

/**
 * Soft-deletes a price list item.
 * @param id - The unique identifier of the item to delete.
 * @returns A promise that resolves to an `ActionResult` with success status.
 */
export const deletePriceListItem = withTenantPermission<string, { success: boolean }>(
  'canManagePriceList',
  async (_session, id) => {
    try {
      const deleted = await priceListRepo.deleteItem(id);

      if (!deleted) {
        return { success: false, error: 'Price list item not found' };
      }

      revalidatePath(PRICE_LIST_PATH);
      return { success: true, data: { success: true } };
    } catch (error) {
      return handleActionError(error, 'Failed to delete price list item');
    }
  },
);
