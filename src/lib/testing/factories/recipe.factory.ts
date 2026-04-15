import { testIds } from '../id-generator';
import type {
  RecipeListItem,
  RecipeWithDetails,
  RecipeItemListItem,
} from '@/features/finances/recipes/types';

export function createRecipeResponse(overrides: Partial<RecipeListItem> = {}): RecipeListItem {
  return {
    id: testIds.recipe(),
    name: 'Test Recipe',
    description: 'A test recipe description',
    labourCostType: 'FIXED_AMOUNT',
    labourAmount: 25,
    roundPrice: false,
    roundingMethod: undefined,
    totalMaterialsCost: 100,
    labourCost: 25,
    totalCost: 125,
    totalRetailPrice: 150,
    sellingPrice: 178.57,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

export function createRecipeItemResponse(
  overrides: Partial<RecipeItemListItem> = {},
): RecipeItemListItem {
  return {
    id: testIds.recipeItem(),
    recipeId: testIds.recipe(),
    priceListItemId: null,
    name: 'Test Flower',
    quantity: 10,
    unitPrice: 2,
    lineTotal: 20,
    retailPrice: 3,
    retailLineTotal: 30,
    order: 0,
    ...overrides,
  };
}

export function createRecipeDetails(overrides: Partial<RecipeWithDetails> = {}): RecipeWithDetails {
  const recipe = createRecipeResponse(overrides);
  return {
    ...recipe,
    notes: 'Test notes',
    items: overrides.items ?? [createRecipeItemResponse({ recipeId: recipe.id })],
    ...overrides,
  };
}
