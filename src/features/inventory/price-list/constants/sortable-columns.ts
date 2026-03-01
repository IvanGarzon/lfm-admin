/**
 * Sortable columns for the price list table.
 * These map to the column IDs defined in price-list-columns.tsx.
 */
export const SORTABLE_PRICE_LIST_COLUMNS = [
  'name',
  'category',
  'costPerUnit',
  'unitType',
  'season',
  'multiplier',
  'createdAt',
  'updatedAt',
] as const;

export type SortablePriceListColumn = (typeof SORTABLE_PRICE_LIST_COLUMNS)[number];
