'use server';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { Customer } from '@/prisma/client';
import { SearchParams } from 'nuqs/server';
import {
  CustomerStatusSchema,
  type CustomerStatusType,
} from '@/zod/inputTypeSchemas/CustomerStatusSchema';
import type { ActionResult } from '@/types/actions';
import { CustomerRepository } from '@/repositories/customer-repository';
import { handleActionError } from '@/lib/error-handler';
import type { CustomerPagination } from '@/features/customers/types';
import { searchParamsCache } from '@/filters/customers/customers-filters';

const customerRepo = new CustomerRepository(prisma);

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

export async function getCustomerById(id: string): Promise<ActionResult<any>> {
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

export async function getOrganizations(): Promise<
  ActionResult<Array<{ id: string; name: string }>>
> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    const organizations = await customerRepo.findAllOrganizations();
    return { success: true, data: organizations };
  } catch (error) {
    return handleActionError(error, 'Failed to fetch organizations');
  }
}
