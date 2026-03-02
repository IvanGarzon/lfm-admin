import type { CreateRecipeGroupInput, UpdateRecipeGroupInput } from '@/schemas/recipe-groups';
import type { PaginationMeta } from '@/types/pagination';

export type RecipeGroupFormInput = CreateRecipeGroupInput | UpdateRecipeGroupInput;

export type RecipeGroupListItem = {
  id: string;
  name: string;
  description: string | null;
  totalCost: number;
  itemCount: number;
  createdAt: Date;
  updatedAt: Date;
};

export type RecipeGroupItemListItem = {
  id: string;
  recipeGroupId: string;
  recipeId: string;
  quantity: number;
  subtotal: number;
  order: number;
  recipe: {
    id: string;
    name: string;
    totalRetailPrice: number;
    totalCost: number;
  };
};

export type RecipeGroupWithDetails = RecipeGroupListItem & {
  items: RecipeGroupItemListItem[];
};

export interface RecipeGroupFilters {
  search?: string;
  page: number;
  perPage: number;
  sort?: { id: string; desc: boolean }[];
}

export type RecipeGroupPagination = {
  items: RecipeGroupListItem[];
  pagination: PaginationMeta;
};
