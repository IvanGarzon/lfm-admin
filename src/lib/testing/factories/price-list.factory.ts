/**
 * Price List Factory
 *
 * Creates mock price list items and related data for testing.
 */

import { testIds } from '../id-generator';
import type { CreatePriceListItemInput, UpdatePriceListItemInput } from '@/schemas/price-list';
import type {
  PriceListItemListItem,
  PriceListItemWithDetails,
} from '@/features/inventory/price-list/types';

/**
 * Creates valid price list item input data for create mutations.
 */
export function createPriceListItemInput(
  overrides: Partial<CreatePriceListItemInput> = {},
): CreatePriceListItemInput {
  return {
    name: 'Red Roses',
    category: 'FLORAL',
    costPerUnit: 1.5,
    multiplier: 3,
    description: null,
    imageUrl: null,
    wholesalePrice: null,
    retailPriceOverride: null,
    unitType: null,
    bunchSize: null,
    season: null,
    ...overrides,
  };
}

/**
 * Creates valid price list item input data for update mutations.
 */
export function createUpdatePriceListItemInput(
  overrides: Partial<UpdatePriceListItemInput> = {},
): UpdatePriceListItemInput {
  return {
    ...createPriceListItemInput(),
    id: testIds.priceListItem(),
    ...overrides,
  };
}

/**
 * Creates a mock price list item list item as returned by searchAndPaginate or findAllActive.
 */
export function createPriceListItemListItem(
  overrides: Partial<PriceListItemListItem> = {},
): PriceListItemListItem {
  return {
    id: testIds.priceListItem(),
    name: 'Red Roses',
    description: null,
    category: 'FLORAL',
    imageUrl: null,
    wholesalePrice: null,
    costPerUnit: 1.5,
    multiplier: 3.0,
    retailPrice: 4.5,
    retailPriceOverride: null,
    unitType: null,
    bunchSize: null,
    season: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    lastCostChange: null,
    ...overrides,
  };
}

/**
 * Creates a mock price list item with full details as returned by findByIdWithDetails.
 */
export function createPriceListItemWithDetails(
  overrides: Partial<PriceListItemWithDetails> = {},
): PriceListItemWithDetails {
  return {
    ...createPriceListItemListItem(overrides),
    costHistory: [],
    ...overrides,
  };
}
