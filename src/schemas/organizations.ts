import { z } from 'zod';
import { StatesSchema } from '@/zod/schemas/enums/States.schema';
import { OrganizationStatusSchema } from '@/zod/schemas/enums/OrganizationStatus.schema';

export const OrganizationSchema = z.object({
  name: z.string().trim().min(2, {
    message: 'Organization name must be at least 2 characters.',
  }),
  address: z.string().trim().optional().nullable(),
  city: z.string().trim().optional().nullable(),
  state: StatesSchema.optional().nullable(),
  postcode: z.string().trim().optional().nullable(),
  country: z.string().trim().default('Australia').optional().nullable(),
  phone: z
    .string()
    .trim()
    .optional()
    .nullable()
    .refine((val) => !val || val.length === 0 || /^[0-9\s\-\+\(\)]+$/.test(val), {
      message: 'Please enter a valid phone number',
    }),
  email: z
    .string()
    .trim()
    .optional()
    .nullable()
    .refine((val) => !val || val.length === 0 || z.string().email().safeParse(val).success, {
      message: 'Please enter a valid email address',
    }),
  website: z
    .string()
    .trim()
    .optional()
    .nullable()
    .refine((val) => !val || val.length === 0 || z.string().url().safeParse(val).success, {
      message: 'Please enter a valid URL (e.g., https://example.com)',
    }),
  abn: z.string().trim().optional().nullable(),
  status: OrganizationStatusSchema.default('ACTIVE').optional(),
});

export const CreateOrganizationSchema = OrganizationSchema;

export const UpdateOrganizationSchema = OrganizationSchema.extend({
  id: z.string().min(1, { message: 'Invalid organization ID' }),
});

export const DeleteOrganizationSchema = z.object({
  id: z.string().min(1, { message: 'Invalid organization ID' }),
});

export type CreateOrganizationInput = z.infer<typeof CreateOrganizationSchema>;
export type UpdateOrganizationInput = z.infer<typeof UpdateOrganizationSchema>;
export type DeleteOrganizationInput = z.infer<typeof DeleteOrganizationSchema>;
