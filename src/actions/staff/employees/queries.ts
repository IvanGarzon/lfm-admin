'use server';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { SearchParams } from 'nuqs/server';

import type { ActionResult } from '@/types/actions';
import { EmployeeRepository } from '@/repositories/employee-repository';
import { handleActionError } from '@/lib/error-handler';
import type { EmployeePagination, EmployeeListItem } from '@/features/staff/employees/types';
import { searchParamsCache } from '@/filters/employees/employee-filters';

const employeeRepo = new EmployeeRepository(prisma);

export async function getEmployees(
  searchParams: SearchParams,
): Promise<ActionResult<EmployeePagination>> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    const filters = searchParamsCache.parse(searchParams);
    const result = await employeeRepo.searchAndPaginate(filters);

    return { success: true, data: result };
  } catch (error) {
    return handleActionError(error, 'Failed to fetch employees');
  }
}

export async function getEmployeeById(id: string): Promise<ActionResult<EmployeeListItem | null>> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    const employee = await employeeRepo.findEmployeeById(id);
    if (!employee) {
      return { success: false, error: 'Employee not found' };
    }

    return { success: true, data: employee };
  } catch (error) {
    return handleActionError(error, 'Failed to fetch employee');
  }
}
