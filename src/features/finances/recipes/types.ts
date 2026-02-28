import type { CreateRecipeInput, UpdateRecipeInput } from '@/schemas/recipes';
import type { RecipeItemType } from '@/zod/schemas/enums/RecipeItemType.schema';
import type { PaginationMeta } from '@/types/pagination';

export type RecipeFormInput = CreateRecipeInput | UpdateRecipeInput;

export type RecipeListItem = {
  id: string;
  name: string;
  description?: string | null;
  totalMaterialsCost: number;
  laborCost: number;
  totalProductionCost: number;
  sellingPrice: number;
  profitValue: number;
  profitPercentage: number;
  createdAt: Date;
  updatedAt: Date;
};

export type RecipeWithDetails = RecipeListItem & {
  laborRate: number;
  targetMargin: number;
  notes?: string | null;
  items: RecipeItemListItem[];
};

export type RecipeItemListItem = {
  id: string;
  recipeId: string;
  description: string;
  type: RecipeItemType;
  purchaseUnit: string;
  purchaseUnitQuantity: number;
  purchaseCost: number;
  unitCost: number;
  quantityUsed: number;
  subtotal: number;
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
