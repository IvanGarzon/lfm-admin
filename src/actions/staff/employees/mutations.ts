'use server';

import { revalidatePath } from 'next/cache';
import {
  UpdateEmployeeSchema,
  CreateEmployeeSchema,
  DeleteEmployeeSchema,
  type UpdateEmployeeInput,
  type CreateEmployeeInput,
  type DeleteEmployeeInput,
} from '@/schemas/employees';
import { prisma } from '@/lib/prisma';
import { EmployeeRepository } from '@/repositories/employee-repository';
import { handleActionError } from '@/lib/error-handler';
import { logger } from '@/lib/logger';
import { withTenantPermission } from '@/lib/action-auth';

const employeeRepo = new EmployeeRepository(prisma);

/**
 * Creates a new employee with the provided data.
 * @param data - The input data for creating the employee.
 * @returns A promise that resolves to an `ActionResult` with the new employee's ID.
 */
export const createEmployee = withTenantPermission<CreateEmployeeInput, { id: string }>(
  'canManageEmployees',
  async ({ tenantId }, data) => {
    try {
      const validatedData = CreateEmployeeSchema.parse(data);
      const employee = await employeeRepo.createEmployee(validatedData, tenantId);

      logger.info('Employee created', {
        context: 'createEmployee',
        metadata: { employeeId: employee.id },
      });

      revalidatePath('/staff/employees');

      return { success: true, data: { id: employee.id } };
    } catch (error) {
      return handleActionError(error, 'Failed to create employee');
    }
  },
);

/**
 * Updates an existing employee with the provided data.
 * @param data - The input data for updating the employee.
 * @returns A promise that resolves to an `ActionResult` with the updated employee's ID.
 */
export const updateEmployee = withTenantPermission<UpdateEmployeeInput, { id: string }>(
  'canManageEmployees',
  async ({ tenantId }, data) => {
    try {
      const { id, ...rest } = UpdateEmployeeSchema.parse(data);
      const employee = await employeeRepo.updateEmployee(id, tenantId, rest);

      if (!employee) {
        return { success: false, error: 'Employee not found' };
      }

      logger.info('Employee updated', {
        context: 'updateEmployee',
        metadata: { employeeId: employee.id },
      });

      revalidatePath('/staff/employees');
      revalidatePath(`/staff/employees/${employee.id}`);

      return { success: true, data: { id: employee.id } };
    } catch (error) {
      return handleActionError(error, 'Failed to update employee');
    }
  },
);

/**
 * Deletes an employee.
 * @param data - The input containing the ID of the employee to delete.
 * @returns A promise that resolves to an `ActionResult` with success status.
 */
export const deleteEmployee = withTenantPermission<DeleteEmployeeInput, { success: true }>(
  'canManageEmployees',
  async ({ tenantId }, data) => {
    try {
      const { id } = DeleteEmployeeSchema.parse(data);
      const deleted = await employeeRepo.deleteEmployee(id, tenantId);

      if (!deleted) {
        return { success: false, error: 'Employee not found' };
      }

      logger.info('Employee deleted', {
        context: 'deleteEmployee',
        metadata: { employeeId: id },
      });

      revalidatePath('/staff/employees');

      return { success: true, data: { success: true } };
    } catch (error) {
      return handleActionError(error, 'Failed to delete employee');
    }
  },
);
