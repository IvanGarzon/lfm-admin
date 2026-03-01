'use server';

import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';
import { handleActionError } from '@/lib/error-handler';
import { requirePermission } from '@/lib/permissions';
import {
  CreatePriceListItemSchema,
  UpdatePriceListItemSchema,
  type CreatePriceListItemInput,
  type UpdatePriceListItemInput,
} from '@/schemas/price-list';
import { priceListRepo } from '@/repositories/price-list-repository';
import type { ActionResult } from '@/types/actions';

const PRICE_LIST_PATH = '/inventory/price-list';

/**
 * Creates a new price list item with the provided data.
 * Validates input and creates a new item record with calculated cost.
 * @param data - The input data for creating the item.
 * @returns A promise that resolves to an `ActionResult` with the new item's ID.
 */
export async function createPriceListItem(
  data: CreatePriceListItemInput,
): Promise<ActionResult<{ id: string }>> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    requirePermission(session.user, 'canManagePriceList');
    const validatedData = CreatePriceListItemSchema.parse(data);

    const result = await priceListRepo.createItem(validatedData);
    revalidatePath(PRICE_LIST_PATH);

    return { success: true, data: result };
  } catch (error) {
    return handleActionError(error, 'Failed to create price list item');
  }
}

/**
 * Updates an existing price list item with the provided data.
 * Validates input and recalculates cost, recording cost history if changed.
 * @param data - The input data for updating the item.
 * @returns A promise that resolves to an `ActionResult` with the item's ID.
 */
export async function updatePriceListItem(
  data: UpdatePriceListItemInput,
): Promise<ActionResult<{ id: string }>> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    requirePermission(session.user, 'canManagePriceList');
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
}

/**
 * Soft-deletes a price list item.
 * @param id - The unique identifier of the item to delete.
 * @returns A promise that resolves to an `ActionResult` with success status.
 */
export async function deletePriceListItem(id: string): Promise<ActionResult<{ success: boolean }>> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    requirePermission(session.user, 'canManagePriceList');
    const deleted = await priceListRepo.deleteItem(id);

    if (!deleted) {
      return { success: false, error: 'Price list item not found' };
    }

    revalidatePath(PRICE_LIST_PATH);
    return { success: true, data: { success: true } };
  } catch (error) {
    return handleActionError(error, 'Failed to delete price list item');
  }
}
