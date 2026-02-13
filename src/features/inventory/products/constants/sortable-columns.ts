/**
 * Sortable columns for the products table.
 * These map to the column IDs defined in product-columns.tsx.
 */
export const SORTABLE_PRODUCT_COLUMNS = [
  'name',
  'status',
  'price',
  'stock',
  'createdAt',
  'updatedAt',
] as const;

export type SortableProductColumn = (typeof SORTABLE_PRODUCT_COLUMNS)[number];
