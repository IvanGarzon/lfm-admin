'use server';

import { auth } from '@/auth';
import { RecipeGroupRepository } from '@/repositories/recipe-group-repository';
import { requirePermission } from '@/lib/permissions';
import { handleActionError } from '@/lib/error-handler';
import {
  createRecipeGroupSchema,
  updateRecipeGroupSchema,
  type CreateRecipeGroupInput,
  type UpdateRecipeGroupInput,
} from '@/schemas/recipe-groups';
import type { RecipeGroupListItem } from '@/features/finances/recipe-groups/types';
import type { ActionResult } from '@/types/actions';
import { revalidatePath } from 'next/cache';

const recipeGroupRepo = new RecipeGroupRepository();

/**
 * Creates a new recipe group with its associated recipes.
 */
export async function createRecipeGroup(
  input: CreateRecipeGroupInput,
): Promise<ActionResult<RecipeGroupListItem>> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    requirePermission(session.user, 'canManageRecipes');

    // Validate input
    const validatedInput = createRecipeGroupSchema.parse(input);

    const recipeGroup = await recipeGroupRepo.create(validatedInput);

    revalidatePath('/finances/recipe-groups');

    return {
      success: true,
      data: {
        id: recipeGroup.id,
        name: recipeGroup.name,
        description: recipeGroup.description,
        totalCost: Number(recipeGroup.totalCost),
        itemCount: validatedInput.items.length,
        createdAt: recipeGroup.createdAt,
        updatedAt: recipeGroup.updatedAt,
      },
    };
  } catch (error) {
    return handleActionError(error, 'Failed to create recipe group');
  }
}

/**
 * Updates an existing recipe group and its recipes.
 */
export async function updateRecipeGroup(
  id: string,
  input: UpdateRecipeGroupInput,
): Promise<ActionResult<RecipeGroupListItem>> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    requirePermission(session.user, 'canManageRecipes');

    // Validate input
    const validatedInput = updateRecipeGroupSchema.parse(input);

    const recipeGroup = await recipeGroupRepo.update(id, validatedInput);

    revalidatePath('/finances/recipe-groups');
    revalidatePath(`/finances/recipe-groups/${id}`);

    return {
      success: true,
      data: {
        id: recipeGroup.id,
        name: recipeGroup.name,
        description: recipeGroup.description,
        totalCost: Number(recipeGroup.totalCost),
        itemCount: validatedInput.items?.length ?? 0,
        createdAt: recipeGroup.createdAt,
        updatedAt: recipeGroup.updatedAt,
      },
    };
  } catch (error) {
    return handleActionError(error, 'Failed to update recipe group');
  }
}

/**
 * Soft deletes a recipe group.
 */
export async function deleteRecipeGroup(id: string): Promise<ActionResult<void>> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    requirePermission(session.user, 'canManageRecipes');

    await recipeGroupRepo.delete(id);

    revalidatePath('/finances/recipe-groups');

    return { success: true, data: undefined };
  } catch (error) {
    return handleActionError(error, 'Failed to delete recipe group');
  }
}
