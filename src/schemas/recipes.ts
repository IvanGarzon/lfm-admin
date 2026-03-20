import { z } from 'zod';
import { VALIDATION_LIMITS } from '@/lib/validation';

export const LabourCostTypeSchema = z.enum([
  'FIXED_AMOUNT',
  'PERCENTAGE_OF_RETAIL',
  'PERCENTAGE_OF_MATERIAL',
]);

export type LabourCostType = z.infer<typeof LabourCostTypeSchema>;

export const RoundingMethodSchema = z.enum(['NEAREST', 'PSYCHOLOGICAL_99', 'PSYCHOLOGICAL_95']);

export type RoundingMethod = z.infer<typeof RoundingMethodSchema>;

const RecipeItemSchema = z.object({
  id: z.cuid().optional(),
  priceListItemId: z.cuid().nullable().optional(),
  name: z
    .string()
    .trim()
    .min(1, { error: 'Name is required' })
    .max(VALIDATION_LIMITS.NAME_MAX, {
      error: `Name must be less than ${VALIDATION_LIMITS.NAME_MAX} characters`,
    }),
  quantity: z.number().positive({ error: 'Quantity must be positive' }),
  unitPrice: z.number().nonnegative({ error: 'Price must be non-negative' }),
  lineTotal: z.number().nonnegative(),
  retailPrice: z.number().nonnegative(),
  retailLineTotal: z.number().nonnegative(),
  order: z.number().int(),
});

const RecipeSchema = z.object({
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
  labourCostType: LabourCostTypeSchema,
  labourAmount: z.number().nonnegative({ error: 'Labour amount must be non-negative' }),
  roundPrice: z.boolean().optional(),
  roundingMethod: RoundingMethodSchema.optional(),
  totalMaterialsCost: z.number().nonnegative(),
  labourCost: z.number().nonnegative(),
  totalCost: z.number().nonnegative(),
  totalRetailPrice: z.number().nonnegative(),
  sellingPrice: z.number().nonnegative(),
  notes: z
    .string()
    .max(VALIDATION_LIMITS.NOTES_MAX, {
      error: `Notes must be less than ${VALIDATION_LIMITS.NOTES_MAX} characters`,
    })
    .optional(),
  items: z
    .array(RecipeItemSchema)
    .min(1, { error: 'At least one item is required' })
    .max(100, { error: 'Maximum 100 items allowed' }),
});

export const CreateRecipeSchema = RecipeSchema;
export const UpdateRecipeSchema = RecipeSchema.safeExtend({
  id: z.cuid({ error: 'Invalid recipe ID' }),
});

export type CreateRecipeInput = z.infer<typeof CreateRecipeSchema>;
export type UpdateRecipeInput = z.infer<typeof UpdateRecipeSchema>;
