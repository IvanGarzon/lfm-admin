import type { CreateRecipeInput, UpdateRecipeInput, LabourCostType } from '@/schemas/recipes';
import type { PaginationMeta } from '@/types/pagination';

export type RecipeFormInput = CreateRecipeInput | UpdateRecipeInput;

export type RecipeListItem = {
  id: string;
  name: string;
  description?: string | null;
  labourCostType: LabourCostType;
  labourAmount: number;
  totalMaterialsCost: number;
  laborCost: number;
  totalCost: number;
  totalRetailPrice: number;
  createdAt: Date;
  updatedAt: Date;
};

export type RecipeWithDetails = RecipeListItem & {
  notes?: string | null;
  items: RecipeItemListItem[];
};

export type RecipeItemListItem = {
  id: string;
  recipeId: string;
  priceListItemId?: string | null;
  name: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  retailPrice: number;
  retailLineTotal: number;
  order: number;
};

export interface RecipeFilters {
  search?: string;
  page: number;
  perPage: number;
  sort?: { id: string; desc: boolean }[];
}

export type RecipePagination = {
  items: RecipeListItem[];
  pagination: PaginationMeta;
};
