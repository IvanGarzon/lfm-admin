import { z } from 'zod';
import { GenderSchema } from '@/zod/schemas/enums/Gender.schema';
import { CustomerStatusSchema } from '@/zod/schemas/enums/CustomerStatus.schema';
import { AddressSchema } from '@/schemas/address';

const BaseCustomerSchema = z.object({
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
  useOrganizationAddress: z.boolean(),
  address: AddressSchema.optional().nullable(),
});

// Refinement function for address validation
const addressRefinement = (data: z.infer<typeof BaseCustomerSchema>) => {
  // If no organization is linked, address is required
  if (!data.organizationId) {
    return data.address !== null && data.address !== undefined;
  }
  // If using organization address, no need for customer address
  if (data.useOrganizationAddress) {
    return true;
  }
  // If has organization but not using its address, customer address is optional
  return true;
};

const addressRefinementMessage = {
  message: 'Address is required when not linked to an organization',
  path: ['address'],
};

export const CustomerSchema = BaseCustomerSchema;

// Base types for form use (before refinement)
export type CustomerFormValues = z.infer<typeof BaseCustomerSchema>;
export type CustomerFormValuesWithId = CustomerFormValues & { id: string };

export const CreateCustomerSchema = BaseCustomerSchema.refine(
  addressRefinement,
  addressRefinementMessage,
);

export const UpdateCustomerSchema = BaseCustomerSchema.extend({
  id: z.string().min(1, { error: 'Invalid customer ID' }),
}).refine(addressRefinement, addressRefinementMessage);

export const DeleteCustomerSchema = z.object({
  id: z.string().min(1, { error: 'Invalid customer ID' }),
});

export type CreateCustomerInput = z.infer<typeof CreateCustomerSchema>;
export type UpdateCustomerInput = z.infer<typeof UpdateCustomerSchema>;
export type DeleteCustomerInput = z.infer<typeof DeleteCustomerSchema>;
