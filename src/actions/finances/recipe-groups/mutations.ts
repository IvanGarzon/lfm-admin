'use server';

import { RecipeGroupRepository } from '@/repositories/recipe-group-repository';
import { prisma } from '@/lib/prisma';
import { handleActionError } from '@/lib/error-handler';
import { withTenantPermission } from '@/lib/action-auth';
import {
  createRecipeGroupSchema,
  updateRecipeGroupSchema,
  type CreateRecipeGroupInput,
  type UpdateRecipeGroupInput,
} from '@/schemas/recipe-groups';
import type { RecipeGroupListItem } from '@/features/finances/recipe-groups/types';
import { revalidatePath } from 'next/cache';

const recipeGroupRepo = new RecipeGroupRepository(prisma);

type UpdateRecipeGroupActionInput = {
  id: string;
  data: UpdateRecipeGroupInput;
};

export const createRecipeGroup = withTenantPermission<CreateRecipeGroupInput, RecipeGroupListItem>(
  'canManageRecipes',
  async (ctx, input) => {
    try {
      const validatedInput = createRecipeGroupSchema.parse(input);

      const recipeGroup = await recipeGroupRepo.createRecipeGroup(validatedInput, ctx.tenantId);

      revalidatePath('/finances/recipe-groups');

      return {
        success: true,
        data: {
          id: recipeGroup.id,
          name: recipeGroup.name,
          description: recipeGroup.description,
          totalCost: Number(recipeGroup.totalCost),
          totalSellingPrice: recipeGroup.totalSellingPrice,
          itemCount: validatedInput.items.length,
          createdAt: recipeGroup.createdAt,
          updatedAt: recipeGroup.updatedAt,
        },
      };
    } catch (error) {
      return handleActionError(error, 'Failed to create recipe group');
    }
  },
);

export const updateRecipeGroup = withTenantPermission<
  UpdateRecipeGroupActionInput,
  RecipeGroupListItem
>('canManageRecipes', async (_ctx, { id, data }) => {
  try {
    const validatedInput = updateRecipeGroupSchema.parse(data);

    const recipeGroup = await recipeGroupRepo.updateRecipeGroup(id, validatedInput);

    revalidatePath('/finances/recipe-groups');
    revalidatePath(`/finances/recipe-groups/${id}`);

    return {
      success: true,
      data: {
        id: recipeGroup.id,
        name: recipeGroup.name,
        description: recipeGroup.description,
        totalCost: Number(recipeGroup.totalCost),
        totalSellingPrice: recipeGroup.totalSellingPrice,
        itemCount: validatedInput.items?.length ?? 0,
        createdAt: recipeGroup.createdAt,
        updatedAt: recipeGroup.updatedAt,
      },
    };
  } catch (error) {
    return handleActionError(error, 'Failed to update recipe group');
  }
});

export const deleteRecipeGroup = withTenantPermission<string, void>(
  'canManageRecipes',
  async (_ctx, id) => {
    try {
      await recipeGroupRepo.softDeleteRecipeGroup(id);

      revalidatePath('/finances/recipe-groups');

      return { success: true, data: undefined };
    } catch (error) {
      return handleActionError(error, 'Failed to delete recipe group');
    }
  },
);
