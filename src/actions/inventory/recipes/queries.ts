'use server';

import { RecipeRepository } from '@/repositories/recipe-repository';
import { prisma } from '@/lib/prisma';
import { handleActionError } from '@/lib/error-handler';
import { withTenantPermission } from '@/lib/action-auth';
import type {
  RecipeFilters,
  RecipePagination,
  RecipeWithDetails
} from '@/features/inventory/recipes/types';

const recipeRepo = new RecipeRepository(prisma);

/**
 * Retrieves a paginated list of recipes based on search and filter criteria.
 * @param filters - Typed recipe filters parsed from URL search params by the page layer.
 * @returns An ActionResult containing the paginated recipe list.
 */
export const getRecipes = withTenantPermission<RecipeFilters, RecipePagination>(
  'canReadRecipes',
  async (ctx, filters) => {
    try {
      const result = await recipeRepo.searchRecipes(filters, ctx.tenantId);

      return { success: true, data: result };
    } catch (error) {
      return handleActionError(error, 'Failed to fetch recipes');
    }
  }
);

/**
 * Retrieves a single recipe by ID with all associated items.
 * @param id - The ID of the recipe to retrieve.
 * @returns An ActionResult containing the recipe with full item details, or an error if not found.
 */
export const getRecipeById = withTenantPermission<string, RecipeWithDetails>(
  'canReadRecipes',
  async (ctx, id) => {
    try {
      const recipe = await recipeRepo.findRecipeById(id, ctx.tenantId);

      if (!recipe) {
        return { success: false, error: 'Recipe not found' };
      }

      return { success: true, data: recipe };
    } catch (error) {
      return handleActionError(error, 'Failed to fetch recipe');
    }
  }
);
