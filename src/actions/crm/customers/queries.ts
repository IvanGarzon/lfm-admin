'use server';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { Customer } from '@/prisma/client';
import { SearchParams } from 'nuqs/server';

import type { ActionResult } from '@/types/actions';
import { CustomerRepository } from '@/repositories/customer-repository';
import { handleActionError } from '@/lib/error-handler';
import type { CustomerPagination, CustomerListItem } from '@/features/crm/customers/types';
import { searchParamsCache } from '@/filters/customers/customers-filters';

const customerRepo = new CustomerRepository(prisma);

/**
 * Retrieves all active customers for dropdown selections.
 * Returns a lightweight list of customers with only essential fields.
 * @returns A promise that resolves to an `ActionResult` containing an array of partial customer objects.
 */
export async function getActiveCustomers(): Promise<ActionResult<Partial<Customer>[]>> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    const customers = await customerRepo.findActiveSelection();
    return { success: true, data: customers as Partial<Customer>[] };
  } catch (error) {
    return handleActionError(error, 'Failed to fetch customers');
  }
}

/**
 * Retrieves a paginated list of customers based on search and filter criteria.
 * Supports filtering by name, email, organization, and status.
 * @param searchParams - The search parameters for filtering, sorting, and pagination.
 * @returns A promise that resolves to an `ActionResult` containing the paginated customer data.
 */
export async function getCustomers(
  searchParams: SearchParams,
): Promise<ActionResult<CustomerPagination>> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    const filters = searchParamsCache.parse(searchParams);
    const result = await customerRepo.searchAndPaginate(filters);

    return { success: true, data: result };
  } catch (error) {
    return handleActionError(error, 'Failed to fetch customers');
  }
}

/**
 * Retrieves a single customer by ID with full details.
 * Includes associated organization data and related information.
 * @param id - The unique identifier of the customer to retrieve.
 * @returns A promise that resolves to an `ActionResult` containing the customer details,
 * or an error if the customer is not found.
 */
export async function getCustomerById(id: string): Promise<ActionResult<CustomerListItem | null>> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    const customer = await customerRepo.findByIdWithDetails(id);
    if (!customer) {
      return { success: false, error: 'Customer not found' };
    }

    return { success: true, data: customer };
  } catch (error) {
    return handleActionError(error, 'Failed to fetch customer');
  }
}
