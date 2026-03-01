import { z } from 'zod';
import { VALIDATION_LIMITS } from '@/lib/validation';
import { baseFiltersSchema, createEnumArrayFilter } from '@/schemas/common';
import { PRICE_LIST_CATEGORIES } from '@/features/inventory/price-list/constants/categories';
import { PRICE_LIST_UNIT_TYPES } from '@/features/inventory/price-list/constants/unit-types';
import { PRICE_LIST_SEASONS } from '@/features/inventory/price-list/constants/seasons';

/**
 * Category schema validated against constant set (not enum)
 */
const PriceListCategorySchema = z.enum(PRICE_LIST_CATEGORIES, {
  error: 'Invalid category',
});

const PriceListUnitTypeSchema = z.enum(PRICE_LIST_UNIT_TYPES, {
  error: 'Invalid unit type',
});

const PriceListSeasonSchema = z.enum(PRICE_LIST_SEASONS, {
  error: 'Invalid season',
});

/**
 * Base price list item schema with common fields
 */
const PriceListItemSchema = z.object({
  name: z
    .string({ error: 'Name is required' })
    .trim()
    .min(1, { error: 'Name is required' })
    .max(VALIDATION_LIMITS.NAME_MAX, {
      error: `Name must be at most ${VALIDATION_LIMITS.NAME_MAX} characters`,
    }),
  description: z
    .string()
    .trim()
    .max(VALIDATION_LIMITS.DESCRIPTION_MAX, {
      error: `Description must be at most ${VALIDATION_LIMITS.DESCRIPTION_MAX} characters`,
    })
    .optional()
    .nullable(),
  category: PriceListCategorySchema,
  imageUrl: z.url('Invalid image URL').optional().nullable(),
  wholesalePrice: z
    .number()
    .nonnegative('Wholesale price must be a positive number')
    .optional()
    .nullable(),
  costPerUnit: z
    .number({ error: 'Unit cost is required' })
    .nonnegative('Unit cost must be a positive number'),
  multiplier: z
    .number({ error: 'Multiplier is required' })
    .positive('Multiplier must be greater than zero'),
  retailPriceOverride: z
    .number()
    .positive('Retail price override must be greater than zero')
    .optional()
    .nullable(),

  // Advanced settings (all optional)
  unitType: PriceListUnitTypeSchema.optional().nullable(),
  bunchSize: z
    .number()
    .int('Bunch size must be a whole number')
    .positive('Bunch size must be greater than zero')
    .optional()
    .nullable(),
  season: PriceListSeasonSchema.optional().nullable(),
});

export const CreatePriceListItemSchema = PriceListItemSchema;
export const UpdatePriceListItemSchema = PriceListItemSchema.extend({
  id: z.cuid({ error: 'Invalid price list item ID' }),
});

/**
 * Schema for price list item filters (search/list)
 */
export const PriceListFiltersSchema = baseFiltersSchema.extend({
  category: createEnumArrayFilter(PriceListCategorySchema),
});

// Inferred types
export type CreatePriceListItemInput = z.infer<typeof CreatePriceListItemSchema>;
export type UpdatePriceListItemInput = z.infer<typeof UpdatePriceListItemSchema>;
export type PriceListFiltersInput = z.infer<typeof PriceListFiltersSchema>;
