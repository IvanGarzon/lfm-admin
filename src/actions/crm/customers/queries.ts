'use server';

import { prisma } from '@/lib/prisma';
import { SearchParams } from 'nuqs/server';

import { CustomerRepository } from '@/repositories/customer-repository';
import { handleActionError } from '@/lib/error-handler';
import { withTenant } from '@/lib/action-auth';
import type {
  CustomerPagination,
  CustomerListItem,
  CustomerSelectItem,
} from '@/features/crm/customers/types';
import { searchParamsCache } from '@/filters/customers/customers-filters';

const customerRepo = new CustomerRepository(prisma);

/**
 * Retrieves all active customers for dropdown selections.
 * Returns a lightweight list of customers with only essential fields for dropdowns.
 * @returns A promise that resolves to an `ActionResult` containing an array of customer select items.
 */
export const getActiveCustomers = withTenant<void, CustomerSelectItem[]>(async (ctx) => {
  try {
    const customers = await customerRepo.findActiveCustomers(ctx.tenantId);
    return { success: true, data: customers };
  } catch (error) {
    return handleActionError(error, 'Failed to fetch customers');
  }
});

/**
 * Retrieves a paginated list of customers based on search and filter criteria.
 * Supports filtering by name, email, organisation, and status.
 * @param searchParams - The search parameters for filtering, sorting, and pagination.
 * @returns A promise that resolves to an `ActionResult` containing the paginated customer data.
 */
export const getCustomers = withTenant<SearchParams, CustomerPagination>(
  async (ctx, searchParams) => {
    try {
      const filters = searchParamsCache.parse(searchParams);
      const result = await customerRepo.searchCustomers(filters, ctx.tenantId);

      return { success: true, data: result };
    } catch (error) {
      return handleActionError(error, 'Failed to fetch customers');
    }
  },
);

/**
 * Retrieves a single customer by ID with full details.
 * Includes associated organisation data and related information.
 * @param id - The unique identifier of the customer to retrieve.
 * @returns A promise that resolves to an `ActionResult` containing the customer details,
 * or an error if the customer is not found.
 */
export const getCustomerById = withTenant<string, CustomerListItem | null>(async (ctx, id) => {
  try {
    const customer = await customerRepo.findCustomerById(id, ctx.tenantId);
    if (!customer) {
      return { success: false, error: 'Customer not found' };
    }

    return { success: true, data: customer };
  } catch (error) {
    return handleActionError(error, 'Failed to fetch customer');
  }
});
