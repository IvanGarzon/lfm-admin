'use server';

import { SearchParams } from 'nuqs/server';
import { RecipeGroupRepository } from '@/repositories/recipe-group-repository';
import { prisma } from '@/lib/prisma';
import { handleActionError } from '@/lib/error-handler';
import { withTenantPermission } from '@/lib/action-auth';
import type {
  RecipeGroupPagination,
  RecipeGroupWithDetails,
  RecipeGroupListItem,
} from '@/features/finances/recipe-groups/types';

const recipeGroupRepo = new RecipeGroupRepository(prisma);

/**
 * Retrieves a paginated list of recipe groups based on specified search and filter criteria.
 * @param searchParams - The search parameters for filtering, sorting, and pagination.
 */
export const getRecipeGroups = withTenantPermission<SearchParams, RecipeGroupPagination>(
  'canReadRecipes',
  async (ctx, searchParams) => {
    try {
      const result = await recipeGroupRepo.searchRecipeGroups(
        searchParams as Record<string, string | string[]>,
        ctx.tenantId,
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
  async (ctx, id) => {
    try {
      const recipeGroup = await recipeGroupRepo.findRecipeGroupById(id, ctx.tenantId);

      if (!recipeGroup) {
        return { success: false, error: 'Recipe group not found' };
      }

      const result: RecipeGroupWithDetails = {
        id: recipeGroup.id,
        name: recipeGroup.name,
        description: recipeGroup.description,
        totalCost: Number(recipeGroup.totalCost),
        totalSellingPrice: recipeGroup.totalSellingPrice,
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
  async (ctx) => {
    try {
      const items = await recipeGroupRepo.findAllRecipeGroups(ctx.tenantId);

      return { success: true, data: items };
    } catch (error) {
      return handleActionError(error, 'Failed to fetch recipe groups');
    }
  },
);
