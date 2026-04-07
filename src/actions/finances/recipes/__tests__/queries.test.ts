import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getRecipes, getRecipeById } from '../queries';
import { testIds, mockSessions, createRecipeResponse, createRecipeDetails } from '@/lib/testing';

const { mockRepoInstance, mockAuth, mockHasPermission } = vi.hoisted(() => ({
  mockRepoInstance: {
    searchRecipes: vi.fn(),
    findRecipeById: vi.fn(),
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

const TEST_RECIPE_ID = testIds.recipe();

describe('Recipe Queries', () => {
  const mockSession = mockSessions.manager();

  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue(mockSession);
    mockHasPermission.mockReturnValue(true);
  });

  describe('getRecipes', () => {
    it('returns paginated recipes successfully when authorised', async () => {
      const mockResult = {
        items: [createRecipeResponse({ id: '1' }), createRecipeResponse({ id: '2' })],
        pagination: { page: 1, perPage: 10, total: 2 },
      };

      mockRepoInstance.searchRecipes.mockResolvedValue(mockResult);

      const result = await getRecipes({});

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(mockResult);
      }
      expect(mockRepoInstance.searchRecipes).toHaveBeenCalled();
    });

    it('returns unauthorised when no session', async () => {
      mockAuth.mockResolvedValue(null);

      const result = await getRecipes({});

      expect(result.success).toBe(false);
    });
  });

  describe('getRecipeById', () => {
    it('returns recipe details successfully when authorised', async () => {
      const mockRecipe = createRecipeDetails({ id: TEST_RECIPE_ID });
      mockRepoInstance.findRecipeById.mockResolvedValue(mockRecipe);

      const result = await getRecipeById(TEST_RECIPE_ID);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe(TEST_RECIPE_ID);
      }
    });

    it('returns error when recipe not found', async () => {
      mockRepoInstance.findRecipeById.mockResolvedValue(null);

      const result = await getRecipeById(TEST_RECIPE_ID);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Recipe not found');
      }
    });
  });
});
