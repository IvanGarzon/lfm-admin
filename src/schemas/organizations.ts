import { z } from 'zod';
import { StatesSchema } from '@/zod/schemas/enums/States.schema';
import { OrganizationStatusSchema } from '@/zod/schemas/enums/OrganizationStatus.schema';
import { commonValidators, VALIDATION_LIMITS } from '@/lib/validation';

export const OrganizationSchema = z.object({
  name: commonValidators.name('Organization name'),
  address: commonValidators.stringOptional(VALIDATION_LIMITS.ADDRESS_MAX, 'Address'),
  city: commonValidators.stringOptional(VALIDATION_LIMITS.CITY_MAX, 'City'),
  state: StatesSchema.optional().nullable(),
  postcode: commonValidators.stringOptional(VALIDATION_LIMITS.POSTCODE_MAX, 'Postcode'),
  country: commonValidators
    .stringOptional(VALIDATION_LIMITS.COUNTRY_MAX, 'Country')
    .default('Australia'),
  phone: commonValidators.phoneOptional(),
  email: commonValidators.emailOptional(),
  website: commonValidators.urlOptional(),
  abn: commonValidators.stringOptional(VALIDATION_LIMITS.ABN_MAX, 'ABN'),
  status: OrganizationStatusSchema.default('ACTIVE').optional(),
});

export const CreateOrganizationSchema = OrganizationSchema;

export const UpdateOrganizationSchema = OrganizationSchema.extend({
  id: z.cuid({ error: 'Invalid organization ID' }),
});

export const DeleteOrganizationSchema = z.object({
  id: z.cuid({ error: 'Invalid organization ID' }),
});

export type CreateOrganizationInput = z.infer<typeof CreateOrganizationSchema>;
export type UpdateOrganizationInput = z.infer<typeof UpdateOrganizationSchema>;
export type DeleteOrganizationInput = z.infer<typeof DeleteOrganizationSchema>;
