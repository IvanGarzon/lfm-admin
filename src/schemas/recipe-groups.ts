import { z } from 'zod';

export const recipeGroupItemSchema = z.object({
  recipeId: z.string().min(1, 'Recipe is required'),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  order: z.number().default(0),
});

export const createRecipeGroupSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  description: z.string().max(2000).optional().nullable(),
  items: z.array(recipeGroupItemSchema).min(1, 'At least one recipe is required'),
});

export const updateRecipeGroupSchema = createRecipeGroupSchema.partial();

export type CreateRecipeGroupInput = z.infer<typeof createRecipeGroupSchema>;
export type UpdateRecipeGroupInput = z.infer<typeof updateRecipeGroupSchema>;
export type RecipeGroupItemInput = z.infer<typeof recipeGroupItemSchema>;
