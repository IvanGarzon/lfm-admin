'use server';

import { prisma } from '@/lib/prisma';
import { SearchParams } from 'nuqs/server';

import { EmployeeRepository } from '@/repositories/employee-repository';
import { handleActionError } from '@/lib/error-handler';
import { withTenant } from '@/lib/action-auth';
import type { EmployeePagination, EmployeeListItem } from '@/features/staff/employees/types';
import { searchParamsCache } from '@/filters/employees/employee-filters';

const employeeRepo = new EmployeeRepository(prisma);

/**
 * Retrieves a paginated list of employees based on search and filter criteria.
 * Supports filtering by name, email, role, and status.
 * @param searchParams - The search parameters for filtering, sorting, and pagination.
 * @returns A promise that resolves to an `ActionResult` containing the paginated employee data.
 */
export const getEmployees = withTenant<SearchParams, EmployeePagination>(
  async (session, searchParams) => {
    try {
      const filters = searchParamsCache.parse(searchParams);
      const result = await employeeRepo.searchAndPaginate(filters, session.user.tenantId);

      return { success: true, data: result };
    } catch (error) {
      return handleActionError(error, 'Failed to fetch employees');
    }
  },
);

/**
 * Retrieves a single employee by ID with full details.
 * Includes all employee fields, contact information, role, and related metadata.
 * @param id - The unique identifier of the employee to retrieve.
 * @returns A promise that resolves to an `ActionResult` containing the employee details,
 * or an error if the employee is not found.
 */
export const getEmployeeById = withTenant<string, EmployeeListItem | null>(async (session, id) => {
  try {
    const employee = await employeeRepo.findEmployeeById(id, session.user.tenantId);
    if (!employee) {
      return { success: false, error: 'Employee not found' };
    }

    return { success: true, data: employee };
  } catch (error) {
    return handleActionError(error, 'Failed to fetch employee');
  }
});
