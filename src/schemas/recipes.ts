import { z } from 'zod';
import { RecipeItemTypeSchema } from '@/zod/schemas/enums/RecipeItemType.schema';
import { VALIDATION_LIMITS } from '@/lib/validation';

export const RecipeItemSchema = z.object({
  id: z.cuid().optional(),
  description: z
    .string()
    .trim()
    .min(1, { error: 'Description is required' })
    .max(VALIDATION_LIMITS.DESCRIPTION_MAX, {
      error: `Description must be less than ${VALIDATION_LIMITS.DESCRIPTION_MAX} characters`,
    }),
  type: RecipeItemTypeSchema,
  purchaseUnit: z.string().min(1, { error: 'Purchase unit is required' }),
  purchaseUnitQuantity: z.number().positive({ error: 'Quantity must be positive' }),
  purchaseCost: z.number().nonnegative({ error: 'Purchase cost must be non-negative' }),
  unitCost: z.number().nonnegative(),
  quantityUsed: z.number().positive({ error: 'Quantity used must be positive' }),
  subtotal: z.number().nonnegative(),
  order: z.number().int(),
});

// Base schema for form validation (without calculated fields)
export const RecipeSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { error: 'Name is required' })
    .max(VALIDATION_LIMITS.NAME_MAX, {
      error: `Name must be less than ${VALIDATION_LIMITS.NAME_MAX} characters`,
    }),
  description: z
    .string()
    .max(VALIDATION_LIMITS.DESCRIPTION_MAX, {
      error: `Description must be less than ${VALIDATION_LIMITS.DESCRIPTION_MAX} characters`,
    })
    .optional(),
  laborRate: z.number().min(0).max(100, { error: 'Labor rate must be between 0 and 100' }),
  targetMargin: z
    .number()
    .min(0)
    .max(99.99, { error: 'Target margin must be between 0 and 99.99' }),
  notes: z
    .string()
    .max(VALIDATION_LIMITS.NOTES_MAX, {
      error: `Notes must be less than ${VALIDATION_LIMITS.NOTES_MAX} characters`,
    })
    .optional(),
  laborCost: z.number().min(0).nonnegative(),
  totalMaterialsCost: z.number().min(0).nonnegative(),
  totalProductionCost: z.number().min(0).nonnegative(),
  sellingPrice: z.number().min(0).nonnegative(),
  profitValue: z.number().nonnegative(),
  profitPercentage: z.number().nonnegative(),
  items: z
    .array(RecipeItemSchema)
    .min(1, { error: 'At least one item is required' })
    .max(100, { error: 'Maximum 100 items allowed' }),
});

// Form validation schemas (without calculated fields)
export const CreateRecipeSchema = RecipeSchema;
export const UpdateRecipeSchema = RecipeSchema.extend({
  id: z.cuid({ error: 'Invalid recipe ID' }),
});

// API types (what gets sent to the server)
export type CreateRecipeInput = z.infer<typeof CreateRecipeSchema>;
export type UpdateRecipeInput = z.infer<typeof UpdateRecipeSchema>;
