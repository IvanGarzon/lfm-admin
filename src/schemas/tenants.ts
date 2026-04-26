import { z } from 'zod';
import { commonValidators } from '@/lib/validation';
import { StatesSchema } from '@/zod/schemas/enums/States.schema';

const slugField = z
  .string()
  .trim()
  .min(1, 'Slug is required')
  .max(100, 'Slug is too long')
  .regex(/^[a-z0-9-]+$/, 'Only lowercase letters, numbers, and hyphens');

const BaseTenantSchema = z.object({
  name: commonValidators.name('Name'),
  slug: slugField,
});

export const CreateTenantSchema = BaseTenantSchema.extend({
  adminEmail: commonValidators.email(),
});

export const UpdateTenantSchema = BaseTenantSchema.partial();
export const DeleteTenantSchema = z.object({ id: z.cuid() });

export const UpdateTenantSettingsSchema = z.object({
  logoUrl: commonValidators.urlOptional(),
  abn: z.string().trim().max(14).optional().nullable(),
  email: commonValidators.email().optional().nullable(),
  phone: commonValidators.phoneOptional().optional().nullable(),
  website: commonValidators.urlOptional(),
  bankName: z.string().trim().max(100).optional().nullable(),
  bsb: z.string().trim().max(10).optional().nullable(),
  accountNumber: z.string().trim().max(20).optional().nullable(),
  accountName: z.string().trim().max(100).optional().nullable(),
  address: z.string().trim().max(200).optional().nullable(),
  city: z.string().trim().max(100).optional().nullable(),
  state: StatesSchema.optional().nullable(),
  postcode: z.string().trim().max(10).optional().nullable(),
  country: z.string().trim().max(100).optional().nullable(),
});

export type CreateTenantInput = z.infer<typeof CreateTenantSchema>;
export type UpdateTenantInput = z.infer<typeof UpdateTenantSchema>;
export type DeleteTenantInput = z.infer<typeof DeleteTenantSchema>;
export type UpdateTenantSettingsInput = z.infer<typeof UpdateTenantSettingsSchema>;
