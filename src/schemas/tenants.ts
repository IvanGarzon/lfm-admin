import { z } from 'zod';
import { commonValidators } from '@/lib/validation';

export const CreateTenantSchema = z.object({
  name: commonValidators.name('Name'),
  slug: z
    .string()
    .trim()
    .min(1, 'Slug is required')
    .max(100, 'Slug is too long')
    .regex(/^[a-z0-9-]+$/, 'Only lowercase letters, numbers, and hyphens'),
  adminEmail: commonValidators.email(),
});

export type CreateTenantInput = z.infer<typeof CreateTenantSchema>;
