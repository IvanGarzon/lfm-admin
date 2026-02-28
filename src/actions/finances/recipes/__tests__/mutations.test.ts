import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createRecipe, updateRecipe, deleteRecipe } from '../mutations';
import { testIds, mockSessions, createRecipeDetails } from '@/lib/testing';
import { revalidatePath } from 'next/cache';

const { mockRepoInstance, mockAuth, mockRequirePermission } = vi.hoisted(() => ({
  mockRepoInstance: {
    createWithItems: vi.fn(),
    updateWithItems: vi.fn(),
    softDelete: vi.fn(),
  },
  mockAuth: vi.fn(),
  mockRequirePermission: vi.fn(),
}));

// Mock RecipeRepository
vi.mock('@/repositories/recipe-repository', () => {
  return {
    RecipeRepository: vi.fn().mockImplementation(function () {
      return mockRepoInstance;
    }),
  };
});

vi.mock('@/auth', () => ({
  auth: mockAuth,
}));

vi.mock('@/lib/permissions', () => ({
  requirePermission: mockRequirePermission,
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

const TEST_RECIPE_ID = testIds.recipe();

describe('Recipe Mutations', () => {
  const mockSession = mockSessions.manager();

  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue(mockSession);
  });

  describe('createRecipe', () => {
    it('creates a recipe successfully when authorized', async () => {
      const input = {
        name: 'New Recipe',
        laborRate: 25,
        targetMargin: 30,
        totalMaterialsCost: 100,
        laborCost: 25,
        totalProductionCost: 125,
        sellingPrice: 178.57,
        profitValue: 53.57,
        profitPercentage: 30,
        items: [
          {
            description: 'Test Item',
            type: 'FLORAL',
            purchaseUnit: 'Stem',
            purchaseUnitQuantity: 1,
            purchaseCost: 2,
            unitCost: 2,
            quantityUsed: 10,
            subtotal: 20,
            order: 0,
          },
        ],
      };

      const mockCreated = createRecipeDetails({ ...input, id: TEST_RECIPE_ID } as any);
      mockRepoInstance.createWithItems.mockResolvedValue(mockCreated);

      // @ts-ignore - Valid enough for testing
      const result = await createRecipe(input);

      expect(result.success).toBe(true);
      expect(mockRequirePermission).toHaveBeenCalledWith(mockSession.user, 'canManageRecipes');
      expect(revalidatePath).toHaveBeenCalledWith('/finances/recipes');
    });
  });

  describe('updateRecipe', () => {
    it('updates a recipe successfully when authorized', async () => {
      const input = {
        id: TEST_RECIPE_ID,
        name: 'Updated Recipe',
        laborRate: 25,
        targetMargin: 30,
        totalMaterialsCost: 100,
        laborCost: 25,
        totalProductionCost: 125,
        sellingPrice: 178.57,
        profitValue: 53.57,
        profitPercentage: 30,
        items: [
          {
            description: 'Test Item',
            type: 'FLORAL',
            purchaseUnit: 'Stem',
            purchaseUnitQuantity: 1,
            purchaseCost: 2,
            unitCost: 2,
            quantityUsed: 10,
            subtotal: 20,
            order: 0,
          },
        ],
      };

      const mockUpdated = createRecipeDetails({ ...input, id: TEST_RECIPE_ID } as any);
      mockRepoInstance.updateWithItems.mockResolvedValue(mockUpdated);

      // @ts-ignore - Valid enough for testing
      const result = await updateRecipe(TEST_RECIPE_ID, input);

      expect(result.success).toBe(true);
      expect(revalidatePath).toHaveBeenCalledWith('/finances/recipes');
    });
  });

  describe('deleteRecipe', () => {
    it('deletes a recipe successfully when authorized', async () => {
      mockRepoInstance.softDelete.mockResolvedValue(true);

      const result = await deleteRecipe(TEST_RECIPE_ID);

      expect(result.success).toBe(true);
      expect(mockRepoInstance.softDelete).toHaveBeenCalledWith(TEST_RECIPE_ID);
      expect(revalidatePath).toHaveBeenCalledWith('/finances/recipes');
    });
  });
});
