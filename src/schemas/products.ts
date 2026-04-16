import { z } from 'zod';
import { VALIDATION_LIMITS } from '@/lib/validation';
import { ProductStatusSchema } from '@/zod/schemas/enums/ProductStatus.schema';
import { baseFiltersSchema, createEnumArrayFilter } from '@/schemas/common';

/**
 * Base product schema with common fields
 */
const ProductSchema = z.object({
  name: z
    .string({ error: 'Product name is required' })
    .min(1, { error: 'Product name is required' })
    .max(VALIDATION_LIMITS.NAME_MAX, {
      error: `Name must be at most ${VALIDATION_LIMITS.NAME_MAX} characters`,
    }),
  description: z
    .string()
    .max(
      VALIDATION_LIMITS.NOTES_MAX,
      `Description must be at most ${VALIDATION_LIMITS.NOTES_MAX} characters`,
    )
    .optional()
    .nullable(),
  status: ProductStatusSchema,
  price: z.number({ error: 'Price is required' }).min(0, 'Price must be a positive number'),
  stock: z
    .number({ error: 'Stock is required' })
    .int('Stock must be a whole number')
    .min(0, 'Stock must be a positive number'),
  imageUrl: z.url('Invalid image URL').optional().nullable(),
  availableAt: z.date().optional().nullable(),
});

export const CreateProductSchema = ProductSchema;
export const UpdateProductSchema = ProductSchema.safeExtend({
  id: z.cuid({ error: 'Invalid product ID' }),
});

/**
 * Schema for product filters (search/list)
 */
export const ProductFiltersSchema = baseFiltersSchema.extend({
  status: createEnumArrayFilter(ProductStatusSchema),
});

export const DeleteProductSchema = z.object({ id: z.cuid({ error: 'Invalid product ID' }) });

export const UpdateProductStatusSchema = z.object({
  id: z.cuid({ error: 'Invalid product ID' }),
  status: ProductStatusSchema,
});

export const UpdateProductStockSchema = z.object({
  id: z.cuid({ error: 'Invalid product ID' }),
  quantity: z.number({ error: 'Quantity is required' }).int('Quantity must be a whole number'),
});

export const BulkUpdateProductStatusSchema = z.object({
  ids: z.array(z.cuid({ error: 'Invalid product ID' })),
  status: ProductStatusSchema,
});

export const BulkDeleteProductsSchema = z.object({
  ids: z.array(z.cuid({ error: 'Invalid product ID' })),
});

// Inferred types
export type CreateProductInput = z.infer<typeof CreateProductSchema>;
export type UpdateProductInput = z.infer<typeof UpdateProductSchema>;
export type DeleteProductInput = z.infer<typeof DeleteProductSchema>;
export type ProductFiltersInput = z.infer<typeof ProductFiltersSchema>;
export type UpdateProductStatusInput = z.infer<typeof UpdateProductStatusSchema>;
export type UpdateProductStockInput = z.infer<typeof UpdateProductStockSchema>;
export type BulkUpdateProductStatusInput = z.infer<typeof BulkUpdateProductStatusSchema>;
export type BulkDeleteProductsInput = z.infer<typeof BulkDeleteProductsSchema>;
