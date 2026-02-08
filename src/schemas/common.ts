import { z } from 'zod';
import { commonValidators, VALIDATION_LIMITS } from '@/lib/validation';

/**
 * Shared sorting schemas for table sorting
 */
export const sortingItemSchema = z.object({
  id: z.string(),
  desc: z.boolean(),
});

export const sortingSchema = z.union([z.string(), z.array(z.unknown())]).transform((val) => {
  if (typeof val === 'string') {
    try {
      const parsed = JSON.parse(val);
      return z.array(sortingItemSchema).parse(parsed);
    } catch {
      return [];
    }
  }
  if (Array.isArray(val)) {
    return z.array(sortingItemSchema).parse(val);
  }
  return [];
});

export type SortingItem = z.infer<typeof sortingItemSchema>;

/**
 * Shared filter field schemas
 * These extend commonValidators with filter-specific needs (coerce for URL params, defaults)
 */
export const searchFilterSchema = commonValidators.searchQuery().default('').optional();

export const pageFilterSchema = z.coerce
  .number()
  .pipe(commonValidators.page())
  .default(VALIDATION_LIMITS.PAGE_MIN);

export const perPageFilterSchema = z.coerce
  .number()
  .pipe(commonValidators.perPage())
  .default(VALIDATION_LIMITS.PER_PAGE_DEFAULT);

export const sortFilterSchema = sortingSchema.default([]);

/**
 * Helper function to create enum array filter schemas
 * Accepts comma-separated strings or arrays and parses them with the provided enum schema
 */
export const createEnumArrayFilter = <T extends z.ZodTypeAny>(enumSchema: T) =>
  z
    .union([z.string(), z.array(z.string())])
    .transform((val) => {
      const arr = Array.isArray(val) ? val : val ? val.split(',').map((v) => v.trim()) : [];
      return arr.length === 0 ? undefined : arr.map((v) => enumSchema.parse(v));
    })
    .optional();

/**
 * Base filter schema with common pagination and search fields
 * Extend this schema to add entity-specific filters
 */
export const baseFiltersSchema = z.object({
  search: searchFilterSchema,
  page: pageFilterSchema,
  perPage: perPageFilterSchema,
  sort: sortFilterSchema,
});
