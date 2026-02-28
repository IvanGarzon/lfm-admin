import { RecipeItemType } from '@/prisma/client';
import { testIds } from '../id-generator';
import type {
  RecipeListItem,
  RecipeWithDetails,
  RecipeItemListItem,
} from '@/features/finances/recipes/types';

export const createRecipeResponse = (overrides: Partial<RecipeListItem> = {}): RecipeListItem => ({
  id: testIds.recipe(),
  name: 'Test Recipe',
  description: 'A test recipe description',
  totalMaterialsCost: 100,
  laborCost: 25,
  totalProductionCost: 125,
  sellingPrice: 178.57,
  profitValue: 53.57,
  profitPercentage: 30,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const createRecipeItemResponse = (
  overrides: Partial<RecipeItemListItem> = {},
): RecipeItemListItem => ({
  id: testIds.recipeItem(),
  recipeId: testIds.recipe(),
  description: 'Test Flower',
  type: RecipeItemType.FLORAL,
  purchaseUnit: 'Package',
  purchaseUnitQuantity: 24,
  purchaseCost: 48,
  unitCost: 2,
  quantityUsed: 12,
  subtotal: 24,
  order: 0,
  ...overrides,
});

export const createRecipeDetails = (
  overrides: Partial<RecipeWithDetails> = {},
): RecipeWithDetails => {
  const recipe = createRecipeResponse(overrides);
  return {
    ...recipe,
    laborRate: 25,
    targetMargin: 30,
    notes: 'Test notes',
    items: overrides.items || [createRecipeItemResponse({ recipeId: recipe.id })],
    ...overrides,
  };
};
