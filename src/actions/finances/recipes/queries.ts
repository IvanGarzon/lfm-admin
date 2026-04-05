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
 * Retrieves a paginated list of recipes based on specified search and filter criteria.
 * @param searchParams - The search parameters for filtering, sorting, and pagination.
 */
export const getRecipes = withTenantPermission<SearchParams, RecipePagination>(
  'canReadRecipes',
  async (session, searchParams) => {
    try {
      const filters = searchParamsCache.parse(searchParams);
      const result = await recipeRepo.searchAndPaginate(filters, session.user.tenantId);

      return { success: true, data: result };
    } catch (error) {
      return handleActionError(error, 'Failed to fetch recipes');
    }
  },
);

/**
 * Retrieves a single recipe by its unique identifier, including associated items.
 * @param id - The ID of the recipe to retrieve.
 */
export const getRecipeById = withTenantPermission<string, RecipeWithDetails>(
  'canReadRecipes',
  async (session, id) => {
    try {
      const recipe = await recipeRepo.findByIdWithDetails(id, session.user.tenantId);

      if (!recipe) {
        return { success: false, error: 'Recipe not found' };
      }

      return { success: true, data: recipe };
    } catch (error) {
      return handleActionError(error, 'Failed to fetch recipe');
    }
  },
);
