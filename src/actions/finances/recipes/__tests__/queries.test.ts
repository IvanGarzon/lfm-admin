import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getRecipes, getRecipeById } from '../queries';
import { testIds, mockSessions, createRecipeResponse, createRecipeDetails } from '@/lib/testing';

const { mockRepoInstance, mockAuth, mockRequirePermission } = vi.hoisted(() => ({
  mockRepoInstance: {
    searchAndPaginate: vi.fn(),
    findByIdWithDetails: vi.fn(),
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

const TEST_RECIPE_ID = testIds.recipe();

describe('Recipe Queries', () => {
  const mockSession = mockSessions.manager();

  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue(mockSession);
  });

  describe('getRecipes', () => {
    it('returns paginated recipes successfully when authorized', async () => {
      const mockResult = {
        items: [createRecipeResponse({ id: '1' }), createRecipeResponse({ id: '2' })],
        pagination: { page: 1, perPage: 10, total: 2 },
      };

      mockRepoInstance.searchAndPaginate.mockResolvedValue(mockResult);

      const result = await getRecipes({});

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(mockResult);
      }
      expect(mockRequirePermission).toHaveBeenCalledWith(mockSession.user, 'canReadRecipes');
      expect(mockRepoInstance.searchAndPaginate).toHaveBeenCalled();
    });

    it('returns unauthorized when no session', async () => {
      mockAuth.mockResolvedValue(null);
      const result = await getRecipes({});
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Unauthorized');
      }
    });
  });

  describe('getRecipeById', () => {
    it('returns recipe details successfully when authorized', async () => {
      const mockRecipe = createRecipeDetails({ id: TEST_RECIPE_ID });

      mockRepoInstance.findByIdWithDetails.mockResolvedValue(mockRecipe);

      const result = await getRecipeById(TEST_RECIPE_ID);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe(TEST_RECIPE_ID);
      }
      expect(mockRequirePermission).toHaveBeenCalledWith(mockSession.user, 'canReadRecipes');
    });

    it('returns error when recipe not found', async () => {
      mockRepoInstance.findByIdWithDetails.mockResolvedValue(null);

      const result = await getRecipeById('non-existent');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Recipe not found');
      }
    });
  });
});
