import { z } from 'zod';
import { StatesSchema } from '@/zod/schemas/enums/States.schema';

export const OrganizationSchema = z.object({
  name: z.string().trim().min(2, {
    message: 'Organization name must be at least 2 characters.',
  }),
  address: z.string().trim().optional().nullable(),
  city: z.string().trim().optional().nullable(),
  state: StatesSchema.optional().nullable(),
  postcode: z.string().trim().optional().nullable(),
  country: z.string().trim().default('Australia').optional().nullable(),
});

export const CreateOrganizationSchema = OrganizationSchema;

export const UpdateOrganizationSchema = OrganizationSchema.extend({
  id: z.string().min(1, { message: 'Invalid organization ID' }),
});

export type CreateOrganizationInput = z.infer<typeof CreateOrganizationSchema>;
export type UpdateOrganizationInput = z.infer<typeof UpdateOrganizationSchema>;
