import type { CreateRecipeGroupInput, UpdateRecipeGroupInput } from '@/schemas/recipe-groups';
import type { PaginationMeta } from '@/types/pagination';

export type RecipeGroupFormInput = CreateRecipeGroupInput | UpdateRecipeGroupInput;

export type RecipeGroupWithItems = {
  id: string;
  tenantId: string;
  name: string;
  description: string | null;
  totalCost: number;
  totalSellingPrice: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  items: {
    id: string;
    recipeGroupId: string;
    recipeId: string;
    quantity: number;
    subtotal: number;
    order: number;
    createdAt: Date;
    updatedAt: Date;
    recipe: {
      id: string;
      name: string;
      totalRetailPrice: number;
      totalCost: number;
      sellingPrice: number;
    };
  }[];
};

export type RecipeGroupSearchParams = {
  search?: string;
  page?: string;
  perPage?: string;
  sort?: string;
};

export type RecipeGroupCreateData = {
  name: string;
  description?: string | null;
  items: { recipeId: string; quantity: number; order: number }[];
};

export type RecipeGroupUpdateData = {
  name?: string;
  description?: string | null;
  items?: { recipeId: string; quantity: number; order: number }[];
};

export type RecipeGroupListItem = {
  id: string;
  name: string;
  description: string | null;
  totalCost: number;
  totalSellingPrice: number;
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
