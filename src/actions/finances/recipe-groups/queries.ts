'use server';

import { SearchParams } from 'nuqs/server';
import { RecipeGroupRepository } from '@/repositories/recipe-group-repository';
import { handleActionError } from '@/lib/error-handler';
import { withTenantPermission } from '@/lib/action-auth';
import type {
  RecipeGroupPagination,
  RecipeGroupWithDetails,
  RecipeGroupListItem,
} from '@/features/finances/recipe-groups/types';

const recipeGroupRepo = new RecipeGroupRepository();

/**
 * Retrieves a paginated list of recipe groups based on specified search and filter criteria.
 * @param searchParams - The search parameters for filtering, sorting, and pagination.
 */
export const getRecipeGroups = withTenantPermission<SearchParams, RecipeGroupPagination>(
  'canReadRecipes',
  async (session, searchParams) => {
    try {
      const result = await recipeGroupRepo.searchAndPaginate(
        searchParams as Record<string, string | string[]>,
        session.user.tenantId,
      );

      return { success: true, data: result };
    } catch (error) {
      return handleActionError(error, 'Failed to fetch recipe groups');
    }
  },
);

/**
 * Retrieves a single recipe group by its unique identifier, including associated recipes.
 * @param id - The ID of the recipe group to retrieve.
 */
export const getRecipeGroupById = withTenantPermission<string, RecipeGroupWithDetails>(
  'canReadRecipes',
  async (session, id) => {
    try {
      const recipeGroup = await recipeGroupRepo.findById(id, session.user.tenantId);

      if (!recipeGroup) {
        return { success: false, error: 'Recipe group not found' };
      }

      const result: RecipeGroupWithDetails = {
        id: recipeGroup.id,
        name: recipeGroup.name,
        description: recipeGroup.description,
        totalCost: Number(recipeGroup.totalCost),
        itemCount: recipeGroup.items.length,
        createdAt: recipeGroup.createdAt,
        updatedAt: recipeGroup.updatedAt,
        items: recipeGroup.items.map((item) => ({
          id: item.id,
          recipeGroupId: item.recipeGroupId,
          recipeId: item.recipeId,
          quantity: item.quantity,
          subtotal: Number(item.subtotal),
          order: item.order,
          recipe: {
            id: item.recipe.id,
            name: item.recipe.name,
            totalRetailPrice: item.recipe.totalRetailPrice,
            totalCost: item.recipe.totalCost,
          },
        })),
      };

      return { success: true, data: result };
    } catch (error) {
      return handleActionError(error, 'Failed to fetch recipe group');
    }
  },
);

/**
 * Retrieves all recipe groups for selection (e.g., in dropdowns).
 */
export const getAllRecipeGroups = withTenantPermission<void, RecipeGroupListItem[]>(
  'canReadRecipes',
  async (session) => {
    try {
      const items = await recipeGroupRepo.getAll(session.user.tenantId);

      return { success: true, data: items };
    } catch (error) {
      return handleActionError(error, 'Failed to fetch recipe groups');
    }
  },
);
