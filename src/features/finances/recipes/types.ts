import type {
  CreateRecipeInput,
  UpdateRecipeInput,
  LabourCostType,
  RoundingMethod,
} from '@/schemas/recipes';
import type { PaginationMeta } from '@/types/pagination';

export type RecipeFormInput = CreateRecipeInput | UpdateRecipeInput;

export type RecipeListItem = {
  id: string;
  name: string;
  description?: string | null;
  labourCostType: LabourCostType;
  labourAmount: number;
  roundPrice?: boolean;
  roundingMethod?: RoundingMethod;
  totalMaterialsCost: number;
  labourCost: number;
  totalCost: number;
  totalRetailPrice: number;
  sellingPrice: number;
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
