'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { CustomerRepository } from '@/repositories/customer-repository';
import { OrganizationRepository } from '@/repositories/organization-repository';
import { handleActionError } from '@/lib/error-handler';
import { withTenant } from '@/lib/action-auth';
import {
  CreateCustomerSchema,
  UpdateCustomerSchema,
  DeleteCustomerSchema,
  type CreateCustomerInput,
  type UpdateCustomerInput,
  type DeleteCustomerInput,
} from '@/schemas/customers';

const customerRepo = new CustomerRepository(prisma);
const organizationRepo = new OrganizationRepository(prisma);

/**
 * Creates a new customer with the provided data.
 * Validates input, checks for duplicate emails, and optionally links to an organisation.
 * @param data - The input data for creating the customer, conforming to `CreateCustomerInput`.
 * @returns A promise that resolves to an `ActionResult` with the new customer's ID.
 */
export const createCustomer = withTenant<CreateCustomerInput, { id: string }>(async (ctx, data) => {
  try {
    const validatedData = CreateCustomerSchema.parse(data);
    const existingCustomer = await customerRepo.findCustomerByEmail(
      validatedData.email,
      ctx.tenantId,
    );

    if (existingCustomer) {
      return {
        success: false,
        error: 'A customer with this email already exists',
      };
    }

    // Handle organisation creation if organisationName is provided
    let finalOrganizationId = validatedData.organizationId ?? null;
    if (validatedData.organizationName && !validatedData.organizationId) {
      const organization = await organizationRepo.findOrCreateOrganization(
        validatedData.organizationName,
        ctx.tenantId,
      );
      finalOrganizationId = organization.id;
    }

    const customer = await customerRepo.createCustomer(
      {
        ...validatedData,
        organizationId: finalOrganizationId,
      },
      ctx.tenantId,
    );

    revalidatePath('/customers');

    return { success: true, data: { id: customer.id } };
  } catch (error) {
    return handleActionError(error, 'Failed to create customer');
  }
});

/**
 * Updates an existing customer with the provided data.
 * Validates input and optionally creates or links to an organisation.
 * @param data - The input data for updating the customer, conforming to `UpdateCustomerInput`.
 * @returns A promise that resolves to an `ActionResult` with the updated customer's ID.
 */
export const updateCustomer = withTenant<UpdateCustomerInput, { id: string }>(async (ctx, data) => {
  try {
    const validatedData = UpdateCustomerSchema.parse(data);
    const existing = await customerRepo.findById(validatedData.id);
    if (!existing) {
      return { success: false, error: 'Customer not found' };
    }

    // Handle organisation creation if organisationName is provided
    let finalOrganizationId = validatedData.organizationId ?? null;
    if (validatedData.organizationName && !validatedData.organizationId) {
      const organization = await organizationRepo.findOrCreateOrganization(
        validatedData.organizationName,
        ctx.tenantId,
      );
      finalOrganizationId = organization.id;
    }

    const customer = await customerRepo.updateCustomer(
      validatedData.id,
      ctx.tenantId,
      {
        ...validatedData,
        organizationId: finalOrganizationId,
      },
      ctx.userId,
    );

    if (!customer) {
      return { success: false, error: 'Failed to update customer' };
    }

    revalidatePath('/crm/customers');
    revalidatePath(`/crm/customers/${customer.id}`);

    return { success: true, data: { id: customer.id } };
  } catch (error) {
    return handleActionError(error, 'Failed to update customer');
  }
});

/**
 * Soft deletes a customer by setting its `deletedAt` timestamp.
 * The customer is not permanently removed from the database.
 * @param data - An object containing the customer ID to delete.
 * @returns A promise that resolves to an `ActionResult` with the deleted customer's ID.
 */
export const deleteCustomer = withTenant<DeleteCustomerInput, { id: string }>(async (ctx, data) => {
  try {
    const { id } = DeleteCustomerSchema.parse(data);
    const success = await customerRepo.softDeleteCustomer(id, ctx.tenantId);

    if (!success) {
      return { success: false, error: 'Failed to delete customer' };
    }

    revalidatePath('/customers');

    return { success: true, data: { id } };
  } catch (error) {
    return handleActionError(error, 'Failed to delete customer');
  }
});
