import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createRecipe, updateRecipe, deleteRecipe } from '../mutations';
import { testIds, mockSessions, createRecipeDetails } from '@/lib/testing';
import { revalidatePath } from 'next/cache';
import type { CreateRecipeInput, UpdateRecipeInput } from '@/schemas/recipes';

const { mockRepoInstance, mockAuth, mockHasPermission } = vi.hoisted(() => ({
  mockRepoInstance: {
    createRecipeWithItems: vi.fn(),
    findRecipeByIdAsListItem: vi.fn(),
    updateRecipeWithItems: vi.fn(),
    softDeleteRecipe: vi.fn(),
  },
  mockAuth: vi.fn(),
  mockHasPermission: vi.fn(),
}));

vi.mock('@/repositories/recipe-repository', () => ({
  RecipeRepository: vi.fn().mockImplementation(function () {
    return mockRepoInstance;
  }),
}));

vi.mock('@/auth', () => ({
  auth: mockAuth,
}));

vi.mock('@/lib/permissions', () => ({
  hasPermission: mockHasPermission,
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

const TEST_RECIPE_ID = testIds.recipe();

const baseItem = {
  name: 'Test Flower',
  quantity: 10,
  unitPrice: 2,
  lineTotal: 20,
  retailPrice: 3,
  retailLineTotal: 30,
  order: 0,
};

const createInput: CreateRecipeInput = {
  name: 'New Recipe',
  labourCostType: 'FIXED_AMOUNT',
  labourAmount: 25,
  totalMaterialsCost: 100,
  labourCost: 25,
  totalCost: 125,
  totalRetailPrice: 150,
  sellingPrice: 178.57,
  items: [baseItem],
};

const updateInput: UpdateRecipeInput = {
  id: TEST_RECIPE_ID,
  name: 'Updated Recipe',
  labourCostType: 'FIXED_AMOUNT',
  labourAmount: 25,
  totalMaterialsCost: 100,
  labourCost: 25,
  totalCost: 125,
  totalRetailPrice: 150,
  sellingPrice: 178.57,
  items: [baseItem],
};

describe('Recipe Mutations', () => {
  const mockSession = mockSessions.manager();

  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue(mockSession);
    mockHasPermission.mockReturnValue(true);
  });

  describe('createRecipe', () => {
    it('creates a recipe successfully when authorised', async () => {
      const mockCreated = createRecipeDetails({ id: TEST_RECIPE_ID, name: createInput.name });
      mockRepoInstance.createRecipeWithItems.mockResolvedValue(mockCreated);

      const result = await createRecipe(createInput);

      expect(result.success).toBe(true);
      expect(mockHasPermission).toHaveBeenCalled();
      expect(revalidatePath).toHaveBeenCalledWith('/finances/recipes');
    });

    it('returns an error when creation fails', async () => {
      mockRepoInstance.createRecipeWithItems.mockRejectedValue(new Error('DB error'));

      const result = await createRecipe(createInput);

      expect(result.success).toBe(false);
    });
  });

  describe('updateRecipe', () => {
    it('updates a recipe successfully when authorised', async () => {
      const mockExisting = createRecipeDetails({ id: TEST_RECIPE_ID });
      const mockUpdated = createRecipeDetails({ id: TEST_RECIPE_ID, name: updateInput.name });
      mockRepoInstance.findRecipeByIdAsListItem.mockResolvedValue(mockExisting);
      mockRepoInstance.updateRecipeWithItems.mockResolvedValue(mockUpdated);

      const result = await updateRecipe(updateInput);

      expect(result.success).toBe(true);
      expect(revalidatePath).toHaveBeenCalledWith('/finances/recipes');
      expect(revalidatePath).toHaveBeenCalledWith(`/finances/recipes/${TEST_RECIPE_ID}`);
    });

    it('returns not found when recipe does not exist', async () => {
      mockRepoInstance.findRecipeByIdAsListItem.mockResolvedValue(null);

      const result = await updateRecipe(updateInput);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Recipe not found');
      }
    });
  });

  describe('deleteRecipe', () => {
    it('deletes a recipe successfully when authorised', async () => {
      mockRepoInstance.softDeleteRecipe.mockResolvedValue(true);

      const result = await deleteRecipe(TEST_RECIPE_ID);

      expect(result.success).toBe(true);
      expect(mockRepoInstance.softDeleteRecipe).toHaveBeenCalledWith(
        TEST_RECIPE_ID,
        mockSession.user.tenantId,
      );
      expect(revalidatePath).toHaveBeenCalledWith('/finances/recipes');
    });

    it('returns an error when deletion fails', async () => {
      mockRepoInstance.softDeleteRecipe.mockRejectedValue(new Error('DB error'));

      const result = await deleteRecipe(TEST_RECIPE_ID);

      expect(result.success).toBe(false);
    });
  });
});
