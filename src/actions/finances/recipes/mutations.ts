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
 * @param input - Validated create input including recipe fields and items.
 * @returns An ActionResult containing the created recipe as a list item.
 */
export const createRecipe = withTenantPermission<CreateRecipeInput, RecipeListItem>(
  'canManageRecipes',
  async (ctx, input) => {
    try {
      const validatedInput = CreateRecipeSchema.parse(input);
      const recipe = await recipeRepo.createRecipeWithItems(validatedInput, ctx.tenantId);

      logger.info('Recipe created', {
        context: 'createRecipe',
        metadata: { id: recipe.id, name: recipe.name },
      });

      revalidatePath('/finances/recipes');

      return { success: true, data: recipe };
    } catch (error) {
      return handleActionError(error, 'Failed to create recipe');
    }
  },
);

/**
 * Updates an existing recipe and replaces its items.
 * @param data - Validated update input including recipe ID, fields, and replacement items.
 * @returns An ActionResult containing the updated recipe's ID.
 */
export const updateRecipe = withTenantPermission<UpdateRecipeInput, { id: string }>(
  'canManageRecipes',
  async (ctx, data) => {
    try {
      const validatedData = UpdateRecipeSchema.parse(data);
      const existing = await recipeRepo.findRecipeByIdAsListItem(validatedData.id, ctx.tenantId);
      if (!existing) {
        return { success: false, error: 'Recipe not found' };
      }

      const recipe = await recipeRepo.updateRecipeWithItems(
        validatedData.id,
        ctx.tenantId,
        validatedData,
      );
      if (!recipe) {
        return { success: false, error: 'Failed to update recipe' };
      }

      logger.info('Recipe updated', {
        context: 'updateRecipe',
        metadata: { id: recipe.id },
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
 * Soft-deletes a recipe by setting its deletedAt timestamp.
 * @param id - The ID of the recipe to delete.
 * @returns An ActionResult indicating success.
 */
export const deleteRecipe = withTenantPermission<string, { success: true }>(
  'canManageRecipes',
  async (ctx, id) => {
    try {
      await recipeRepo.softDeleteRecipe(id, ctx.tenantId);

      logger.info('Recipe deleted', {
        context: 'deleteRecipe',
        metadata: { id },
      });

      revalidatePath('/finances/recipes');

      return { success: true, data: { success: true } };
    } catch (error) {
      return handleActionError(error, 'Failed to delete recipe');
    }
  },
);
