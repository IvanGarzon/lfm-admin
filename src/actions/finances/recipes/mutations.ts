'use server';

import { revalidatePath } from 'next/cache';
import { RecipeRepository } from '@/repositories/recipe-repository';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { handleActionError } from '@/lib/error-handler';
import { withTenantPermission } from '@/lib/action-auth';
import {
  CreateRecipeSchema,
  UpdateRecipeSchema,
  type CreateRecipeInput,
  type UpdateRecipeInput,
} from '@/schemas/recipes';
import type { RecipeListItem } from '@/features/finances/recipes/types';

const recipeRepo = new RecipeRepository(prisma);

/**
 * Creates a new recipe with its associated items.
 */
export const createRecipe = withTenantPermission<CreateRecipeInput, RecipeListItem>(
  'canManageRecipes',
  async (session, input) => {
    try {
      const validatedInput = CreateRecipeSchema.parse(input);
      const recipe = await recipeRepo.createWithItems(validatedInput, session.user.tenantId);

      logger.info('Recipe created', {
        context: 'createRecipe',
        metadata: {
          id: recipe.id,
          name: recipe.name,
        },
      });

      revalidatePath('/finances/recipes');

      return { success: true, data: recipe };
    } catch (error) {
      return handleActionError(error, 'Failed to create recipe');
    }
  },
);

/**
 * Updates an existing recipe and its items.
 */
export const updateRecipe = withTenantPermission<UpdateRecipeInput, { id: string }>(
  'canManageRecipes',
  async (session, data) => {
    try {
      const validatedData = UpdateRecipeSchema.parse(data);
      const existing = await recipeRepo.findById(validatedData.id);
      if (!existing) {
        return { success: false, error: 'Recipe not found' };
      }

      const recipe = await recipeRepo.updateWithItems(validatedData.id, validatedData);
      if (!recipe) {
        return { success: false, error: 'Failed to update recipe' };
      }

      logger.info('Recipe updated', {
        context: 'updateRecipe',
        metadata: {},
      });

      revalidatePath('/finances/recipes');
      revalidatePath(`/finances/recipes/${recipe.id}`);

      return { success: true, data: { id: recipe.id } };
    } catch (error) {
      return handleActionError(error, 'Failed to update recipe');
    }
  },
);

/**
 * Soft deletes a recipe.
 */
export const deleteRecipe = withTenantPermission<string, { success: true }>(
  'canManageRecipes',
  async (_session, id) => {
    try {
      await recipeRepo.softDelete(id);

      logger.info('Recipe deleted', {
        context: 'deleteRecipe',
        metadata: {},
      });

      revalidatePath('/finances/recipes');

      return { success: true, data: { success: true } };
    } catch (error) {
      return handleActionError(error, 'Failed to delete recipe');
    }
  },
);
