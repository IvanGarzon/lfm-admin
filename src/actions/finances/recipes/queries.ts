'use server';

import { auth } from '@/auth';
import { SearchParams } from 'nuqs/server';
import { RecipeRepository } from '@/repositories/recipe-repository';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/permissions';
import { handleActionError } from '@/lib/error-handler';
import type {
  RecipePagination,
  RecipeWithDetails,
  RecipeListItem,
} from '@/features/finances/recipes/types';
import type { ActionResult } from '@/types/actions';
import { searchParamsCache } from '@/filters/recipes/recipes-filters';

const recipeRepo = new RecipeRepository(prisma);

/**
 * Retrieves a paginated list of recipes based on specified search and filter criteria.
 * @param searchParams - The search parameters for filtering, sorting, and pagination.
 */
export async function getRecipes(
  searchParams: SearchParams,
): Promise<ActionResult<RecipePagination>> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    requirePermission(session.user, 'canReadRecipes');

    const filters = searchParamsCache.parse(searchParams);
    const result = await recipeRepo.searchAndPaginate(filters);

    return { success: true, data: result };
  } catch (error) {
    return handleActionError(error, 'Failed to fetch recipes');
  }
}

/**
 * Retrieves a single recipe by its unique identifier, including associated items.
 * @param id - The ID of the recipe to retrieve.
 */
export async function getRecipeById(id: string): Promise<ActionResult<RecipeWithDetails>> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    requirePermission(session.user, 'canReadRecipes');
    const recipe = await recipeRepo.findByIdWithDetails(id);

    if (!recipe) {
      return { success: false, error: 'Recipe not found' };
    }

    return { success: true, data: recipe };
  } catch (error) {
    return handleActionError(error, 'Failed to fetch recipe');
  }
}
