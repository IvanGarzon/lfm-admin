'use server';

import { SearchParams } from 'nuqs/server';
import { RecipeRepository } from '@/repositories/recipe-repository';
import { prisma } from '@/lib/prisma';
import { handleActionError } from '@/lib/error-handler';
import { withTenantPermission } from '@/lib/action-auth';
import type { RecipePagination, RecipeWithDetails } from '@/features/finances/recipes/types';
import { searchParamsCache } from '@/filters/recipes/recipes-filters';

const recipeRepo = new RecipeRepository(prisma);

/**
 * Retrieves a paginated list of recipes based on search and filter criteria.
 * @param searchParams - Raw URL search params for filtering, sorting, and pagination.
 * @returns An ActionResult containing the paginated recipe list.
 */
export const getRecipes = withTenantPermission<SearchParams, RecipePagination>(
  'canReadRecipes',
  async (ctx, searchParams) => {
    try {
      const filters = searchParamsCache.parse(searchParams);
      const result = await recipeRepo.searchRecipes(filters, ctx.tenantId);

      return { success: true, data: result };
    } catch (error) {
      return handleActionError(error, 'Failed to fetch recipes');
    }
  },
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
  },
);
