'use server';

import { auth } from '@/auth';
import { RecipeRepository } from '@/repositories/recipe-repository';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/permissions';
import { handleActionError } from '@/lib/error-handler';
import {
  CreateRecipeSchema,
  UpdateRecipeSchema,
  type CreateRecipeInput,
  type UpdateRecipeInput,
} from '@/schemas/recipes';
import type { RecipeListItem } from '@/features/finances/recipes/types';
import type { ActionResult } from '@/types/actions';
import { revalidatePath } from 'next/cache';

const recipeRepo = new RecipeRepository(prisma);

const mapPrismaRecipeToListItem = (recipe: any): RecipeListItem => ({
  id: recipe.id,
  name: recipe.name,
  description: recipe.description,
  totalMaterialsCost: Number(recipe.totalMaterialsCost),
  laborCost: Number(recipe.laborCost),
  totalProductionCost: Number(recipe.totalProductionCost),
  sellingPrice: Number(recipe.sellingPrice),
  profitValue: Number(recipe.profitValue),
  profitPercentage: Number(recipe.profitPercentage),
  createdAt: recipe.createdAt,
  updatedAt: recipe.updatedAt,
});

/**
 * Creates a new recipe with its associated items.
 */
export async function createRecipe(
  input: CreateRecipeInput,
): Promise<ActionResult<RecipeListItem>> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    requirePermission(session.user, 'canManageRecipes');

    // Validate input
    const validatedInput = CreateRecipeSchema.parse(input);

    const recipe = await recipeRepo.createWithItems(validatedInput);

    revalidatePath('/finances/recipes');

    return { success: true, data: mapPrismaRecipeToListItem(recipe) };
  } catch (error) {
    return handleActionError(error, 'Failed to create recipe');
  }
}

/**
 * Updates an existing recipe and its items.
 */
export async function updateRecipe(
  id: string,
  input: UpdateRecipeInput,
): Promise<ActionResult<RecipeListItem>> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    requirePermission(session.user, 'canManageRecipes');

    // Validate input
    const validatedInput = UpdateRecipeSchema.parse(input);

    const recipe = await recipeRepo.updateWithItems(id, validatedInput);

    revalidatePath('/finances/recipes');
    if (id) revalidatePath(`/finances/recipes/${id}`);

    return { success: true, data: mapPrismaRecipeToListItem(recipe) };
  } catch (error) {
    return handleActionError(error, 'Failed to update recipe');
  }
}

/**
 * Soft deletes a recipe.
 */
export async function deleteRecipe(id: string): Promise<ActionResult<void>> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    requirePermission(session.user, 'canManageRecipes');

    await recipeRepo.softDelete(id);

    revalidatePath('/finances/recipes');

    return { success: true, data: undefined };
  } catch (error) {
    return handleActionError(error, 'Failed to delete recipe');
  }
}
