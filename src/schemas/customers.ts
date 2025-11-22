import { z } from 'zod';
import { GenderSchema } from '@/zod/inputTypeSchemas/GenderSchema';

export const CreateCustomerSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.email({
    message: 'Please enter a valid email address.',
  }),
  phone: z.string().optional(),
  gender: GenderSchema,
  organizationId: z.string().optional(),
  organizationName: z.string().optional(),
});

export type CreateCustomerInput = z.infer<typeof CreateCustomerSchema>;
