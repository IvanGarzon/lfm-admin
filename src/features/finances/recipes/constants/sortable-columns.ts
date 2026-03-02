export const SORTABLE_RECIPE_COLUMNS = [
  'name',
  'totalMaterialsCost',
  'labourCost',
  'totalCost',
  'totalRetailPrice',
  'sellingPrice',
  'createdAt',
  'updatedAt',
] as const;

export type SortableRecipeColumn = (typeof SORTABLE_RECIPE_COLUMNS)[number];
