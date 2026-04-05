'use server';

import { revalidatePath } from 'next/cache';
import {
  UpdateEmployeeSchema,
  CreateEmployeeSchema,
  type UpdateEmployeeInput,
  type CreateEmployeeInput,
} from '@/schemas/employees';
import { prisma } from '@/lib/prisma';
import { EmployeeRepository } from '@/repositories/employee-repository';
import { handleActionError } from '@/lib/error-handler';
import { logger } from '@/lib/logger';
import { withTenant } from '@/lib/action-auth';

const employeeRepo = new EmployeeRepository(prisma);

/**
 * Creates a new employee with the provided data.
 * @param data - The input data for creating the employee.
 * @returns A promise that resolves to an `ActionResult` with the new employee's ID.
 */
export const createEmployee = withTenant<CreateEmployeeInput, { id: string }>(
  async (_session, data) => {
    try {
      const validatedData = CreateEmployeeSchema.parse(data);
      const employee = await employeeRepo.create(validatedData);

      logger.info('Employee created', {
        context: 'createEmployee',
        metadata: {
          employeeId: employee.id,
          name: `${employee.firstName} ${employee.lastName}`,
        },
      });

      revalidatePath('/staff/employees');

      return {
        success: true,
        data: { id: employee.id },
      };
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
export const updateEmployee = withTenant<UpdateEmployeeInput, { id: string }>(
  async (_session, data) => {
    try {
      const validatedData = UpdateEmployeeSchema.parse(data);
      const existing = await employeeRepo.findById(validatedData.id);

      if (!existing) {
        return { success: false, error: 'Employee not found' };
      }

      const employee = await employeeRepo.update(validatedData.id, validatedData);

      if (!employee) {
        return { success: false, error: 'Failed to update employee' };
      }

      logger.info('Employee updated', {
        context: 'updateEmployee',
        metadata: {
          employeeId: employee.id,
        },
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
 * @param id - The ID of the employee to delete.
 * @returns A promise that resolves to an `ActionResult` with success status.
 */
export const deleteEmployee = withTenant<string, { success: true }>(async (_session, id) => {
  try {
    const existing = await employeeRepo.findById(id);
    if (!existing) {
      return { success: false, error: 'Employee not found' };
    }

    await employeeRepo.delete(id);

    logger.info('Employee deleted', {
      context: 'deleteEmployee',
      metadata: {
        employeeId: id,
      },
    });

    revalidatePath('/staff/employees');

    return { success: true, data: { success: true } };
  } catch (error) {
    return handleActionError(error, 'Failed to delete employee');
  }
});
