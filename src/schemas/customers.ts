import { z } from 'zod';
import { GenderSchema } from '@/zod/inputTypeSchemas/GenderSchema';
import { CustomerStatusSchema } from '@/zod/inputTypeSchemas/CustomerStatusSchema';

export const CustomerSchema = z.object({
  firstName: z.string().trim().min(2, {
    error: 'First name must be at least 2 characters.',
  }),
  lastName: z.string().trim().min(2, {
    error: 'Last name must be at least 2 characters.',
  }),
  email: z.email('Please enter a valid email address'),
  phone: z.string().optional().nullable(),
  gender: GenderSchema,
  organizationId: z.string().optional().nullable(),
  organizationName: z.string().optional().nullable(),
  status: CustomerStatusSchema,
});

export const CreateCustomerSchema = CustomerSchema;
export const UpdateCustomerSchema = CustomerSchema.extend({
  id: z.string().min(1, { error: 'Invalid customer ID' }),
});

export const DeleteCustomerSchema = z.object({
  id: z.string().min(1, { error: 'Invalid customer ID' }),
});

export type CreateCustomerInput = z.infer<typeof CreateCustomerSchema>;
export type UpdateCustomerInput = z.infer<typeof UpdateCustomerSchema>;
export type DeleteCustomerInput = z.infer<typeof DeleteCustomerSchema>;
