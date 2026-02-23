import { z } from 'zod';
import { VendorStatusSchema } from '@/zod/schemas/enums/VendorStatus.schema';
import { commonValidators, VALIDATION_LIMITS } from '@/lib/validation';
import { baseFiltersSchema, createEnumArrayFilter } from '@/schemas/common';
import { AddressSchema } from '@/schemas/address';

/**
 * Create Vendor Schema
 */
export const CreateVendorSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { error: 'Vendor name is required' })
    .max(VALIDATION_LIMITS.NAME_MAX, {
      error: `Name must be less than ${VALIDATION_LIMITS.NAME_MAX} characters`,
    }),
  email: commonValidators.email(),
  phone: z
    .string()
    .trim()
    .max(50, { error: 'Phone number must be less than 50 characters' })
    .optional()
    .nullable(),
  abn: z
    .string()
    .trim()
    .max(20, { error: 'ABN must be less than 20 characters' })
    .optional()
    .nullable(),
  status: VendorStatusSchema,
  address: AddressSchema.optional().nullable(),
  website: z
    .url({ error: 'Website must be a valid URL' })
    .trim()
    .max(VALIDATION_LIMITS.URL_MAX, {
      error: `Website must be less than ${VALIDATION_LIMITS.URL_MAX} characters`,
    })
    .optional()
    .nullable(),
  paymentTerms: z
    .number()
    .int({ error: 'Payment terms must be a whole number' })
    .min(0, { error: 'Payment terms must be at least 0 days' })
    .max(365, { error: 'Payment terms cannot exceed 365 days' })
    .optional()
    .nullable(),
  taxId: z
    .string()
    .trim()
    .max(50, { error: 'Tax ID must be less than 50 characters' })
    .optional()
    .nullable(),
  notes: z
    .string()
    .trim()
    .max(VALIDATION_LIMITS.NOTES_MAX, {
      error: `Notes must be less than ${VALIDATION_LIMITS.NOTES_MAX} characters`,
    })
    .optional()
    .nullable(),
});

/**
 * Update Vendor Schema
 */
export const UpdateVendorSchema = CreateVendorSchema.extend({
  id: z.cuid({ error: 'Invalid vendor ID' }),
});

/**
 * Update Vendor Status Schema
 */
export const UpdateVendorStatusSchema = z.object({
  id: z.cuid({ error: 'Invalid vendor ID' }),
  status: VendorStatusSchema,
});

/**
 * Delete Vendor Schema
 */
export const DeleteVendorSchema = z.object({
  id: z.cuid({ error: 'Invalid vendor ID' }),
});

/**
 * Vendor Filters Schema
 */
export const VendorFiltersSchema = baseFiltersSchema.extend({
  status: createEnumArrayFilter(VendorStatusSchema),
});

/**
 * Exported Types
 */
export type CreateVendorInput = z.infer<typeof CreateVendorSchema>;
export type UpdateVendorInput = z.infer<typeof UpdateVendorSchema>;
export type UpdateVendorStatusInput = z.infer<typeof UpdateVendorStatusSchema>;
export type DeleteVendorInput = z.infer<typeof DeleteVendorSchema>;
