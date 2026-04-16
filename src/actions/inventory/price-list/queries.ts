'use server';

import { prisma } from '@/lib/prisma';
import { handleActionError } from '@/lib/error-handler';
import { withTenantPermission } from '@/lib/action-auth';
import { PriceListRepository } from '@/repositories/price-list-repository';
import type { SearchParams } from 'nuqs/server';
import type {
  PriceListPagination,
  PriceListItemWithDetails,
  PriceListCostHistoryItem,
  PriceListItemListItem,
} from '@/features/inventory/price-list/types';
import { searchParamsCache } from '@/filters/price-list/price-list-filters';

const priceListRepo = new PriceListRepository(prisma);

/**
 * Retrieves a paginated list of price list items based on search and filter criteria.
 * Supports filtering by name, category, and other attributes.
 * @param searchParams - The search parameters for filtering, sorting, and pagination.
 * @returns A promise that resolves to an `ActionResult` containing the paginated data.
 */
export const getPriceListItems = withTenantPermission<SearchParams, PriceListPagination>(
  'canReadPriceList',
  async (ctx, searchParams) => {
    try {
      const filters = searchParamsCache.parse(searchParams);
      const result = await priceListRepo.searchPriceListItems(filters, ctx.tenantId);

      return { success: true, data: result };
    } catch (error) {
      return handleActionError(error, 'Failed to fetch price list items');
    }
  },
);

/**
 * Retrieves a single price list item by ID with full details including cost history.
 * @param id - The unique identifier of the item to retrieve.
 * @returns A promise that resolves to an `ActionResult` containing the item details.
 */
export const getPriceListItemById = withTenantPermission<string, PriceListItemWithDetails>(
  'canReadPriceList',
  async (ctx, id) => {
    try {
      const item = await priceListRepo.findPriceListItemById(id, ctx.tenantId);

      if (!item) {
        return { success: false, error: 'Price list item not found' };
      }

      return { success: true, data: item };
    } catch (error) {
      return handleActionError(error, 'Failed to fetch price list item');
    }
  },
);

/**
 * Retrieves cost history for a price list item.
 * @param priceListItemId - The ID of the price list item.
 * @returns A promise that resolves to an `ActionResult` containing the cost history.
 */
export const getPriceListCostHistory = withTenantPermission<string, PriceListCostHistoryItem[]>(
  'canReadPriceList',
  async (_session, priceListItemId) => {
    try {
      const history = await priceListRepo.getPriceListCostHistory(priceListItemId);
      return { success: true, data: history };
    } catch (error) {
      return handleActionError(error, 'Failed to fetch cost history');
    }
  },
);

/**
 * Retrieves all active price list items for selection in recipes.
 * @returns A promise that resolves to an `ActionResult` containing all active items.
 */
export const getActivePriceListItems = withTenantPermission<void, PriceListItemListItem[]>(
  'canReadPriceList',
  async (ctx) => {
    try {
      const items = await priceListRepo.findActivePriceListItems(ctx.tenantId);
      return { success: true, data: items };
    } catch (error) {
      return handleActionError(error, 'Failed to fetch price list items');
    }
  },
);
