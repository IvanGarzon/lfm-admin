'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { CustomerRepository } from '@/repositories/customer-repository';
import { OrganizationRepository } from '@/repositories/organization-repository';
import { handleActionError } from '@/lib/error-handler';
import {
  CreateCustomerSchema,
  UpdateCustomerSchema,
  DeleteCustomerSchema,
  type CreateCustomerInput,
  type UpdateCustomerInput,
  type DeleteCustomerInput,
} from '@/schemas/customers';
import type { ActionResult } from '@/types/actions';

const customerRepo = new CustomerRepository(prisma);
const organizationRepo = new OrganizationRepository(prisma);

/**
 * Creates a new customer
 */
export async function createCustomer(
  data: CreateCustomerInput,
): Promise<ActionResult<{ id: string }>> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    const validatedData = CreateCustomerSchema.parse(data);

    // Check if email already exists
    const existingCustomer = await customerRepo.findByEmail(validatedData.email);

    if (existingCustomer) {
      return {
        success: false,
        error: 'A customer with this email already exists',
      };
    }

    // Handle organization creation if organizationName is provided
    let finalOrganizationId = validatedData.organizationId || null;
    if (validatedData.organizationName && !validatedData.organizationId) {
      const organization = await organizationRepo.findOrCreate(validatedData.organizationName);
      finalOrganizationId = organization.id;
    }

    const customer = await customerRepo.createCustomer({
      ...validatedData,
      organizationId: finalOrganizationId,
    });

    revalidatePath('/customers');

    return { success: true, data: { id: customer.id } };
  } catch (error) {
    return handleActionError(error, 'Failed to create customer');
  }
}

/**
 * Updates an existing customer
 */
export async function updateCustomer(
  data: UpdateCustomerInput,
): Promise<ActionResult<{ id: string }>> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    // Validate input
    const validatedData = UpdateCustomerSchema.parse(data);
    const existing = await customerRepo.findById(validatedData.id);
    if (!existing) {
      return { success: false, error: 'Customer not found' };
    }

    // Handle organization creation if organizationName is provided
    let finalOrganizationId = validatedData.organizationId || null;
    if (validatedData.organizationName && !validatedData.organizationId) {
      const organization = await organizationRepo.findOrCreate(validatedData.organizationName);
      finalOrganizationId = organization.id;
    }

    const customer = await customerRepo.updateCustomer(
      validatedData.id,
      {
        ...validatedData,
        organizationId: finalOrganizationId,
      },
      session.user.id,
    );

    if (!customer) {
      return { success: false, error: 'Failed to update customer' };
    }

    revalidatePath('/customers');
    revalidatePath(`/customers/${customer.id}`);

    return { success: true, data: { id: customer.id } };
  } catch (error) {
    return handleActionError(error, 'Failed to update customer');
  }
}

/**
 * Deletes a customer (soft delete)
 */
export async function deleteCustomer(
  data: DeleteCustomerInput,
): Promise<ActionResult<{ id: string }>> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    const { id } = DeleteCustomerSchema.parse(data);
    const success = await customerRepo.softDelete(id);

    if (!success) {
      return { success: false, error: 'Failed to delete customer' };
    }

    revalidatePath('/customers');

    return { success: true, data: { id } };
  } catch (error) {
    return handleActionError(error, 'Failed to delete customer');
  }
}
