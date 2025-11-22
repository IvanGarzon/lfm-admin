'use server';

import { z } from 'zod';
import { GenderSchema } from '@/zod/inputTypeSchemas/GenderSchema';
import { EmployeeStatusSchema } from '@/zod/inputTypeSchemas';
import { SearchParams } from 'nuqs/server';
import { auth } from '@/auth';
import { Employee } from '@/types/employee';
import {
  UpdateEmployeeSchema,
  CreateEmployeeSchema,
  type UpdateEmployeeFormValues,
  type CreateEmployeeFormValues,
} from '@/schemas/employees';

import {
  EmployeeRepository,
  type EmployeeSearchAndPaginateParams,
} from '@/repositories/employee-repository';

const SearchParamsSchema = z.object({
  search: z.string().trim().default(''),
  alphabet: z.string().trim().default(''),
  gender: z
    .union([GenderSchema, z.literal('')])
    .transform((val) => (val === '' ? undefined : val))
    .optional(),
  status: z
    .union([EmployeeStatusSchema, z.literal('')])
    .transform((val) => (val === '' ? undefined : val))
    .optional(),
  page: z.coerce.number().min(1).default(1),
  perPage: z.coerce.number().min(1).max(100).default(20),
});

export async function getEmployees(searchParams: SearchParams) {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  const parseResult = SearchParamsSchema.safeParse(searchParams);
  if (!parseResult.success) {
    throw new Error('Invalid query parameters');
  }

  const repoParams: EmployeeSearchAndPaginateParams = {
    search: parseResult.data.search,
    alphabet: parseResult.data.alphabet,
    gender: parseResult.data.gender,
    status: parseResult.data.status,
    page: parseResult.data.page,
    perPage: parseResult.data.perPage,
  };

  const employeeRepository = new EmployeeRepository();
  const result = await employeeRepository.searchAndPaginate(repoParams);

  return result;
}

export async function getEmployeeById(id: string) {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  if (!id) {
    throw new Error('Employee ID is required');
  }

  const employeeRepository = new EmployeeRepository();
  const employee = await employeeRepository.findById(id);

  if (!employee) {
    throw new Error('Employee not found');
  }

  return employee;
}

export async function updateEmployee(
  employeeUpdateInput: UpdateEmployeeFormValues,
): Promise<Employee> {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  const { id, ...dataToUpdate } = employeeUpdateInput;

  if (!id) {
    throw new Error('Employee ID is required for update.');
  }

  let parsedData: Omit<UpdateEmployeeFormValues, 'id'>;
  try {
    parsedData = UpdateEmployeeSchema.omit({ id: true }).parse(dataToUpdate);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Zod validation errors during employee update:', error.issues);
      throw new Error('Invalid employee data. Please check the fields and try again.');
    }
    throw error;
  }

  const employeeRepository = new EmployeeRepository();
  const updatedEmployee = await employeeRepository.update(id, parsedData);

  if (!updatedEmployee) {
    throw new Error('Employee not found');
  }

  return updatedEmployee;
}

export async function createEmployee(
  employeeCreateInput: CreateEmployeeFormValues,
): Promise<Employee> {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  let parsedData: CreateEmployeeFormValues;

  try {
    parsedData = CreateEmployeeSchema.parse(employeeCreateInput);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Zod validation errors during employee creation:', error.issues);
      throw new Error('Invalid employee data. Please check the fields and try again.');
    }
    throw error;
  }

  const employeeRepository = new EmployeeRepository();
  const createdEmployee = await employeeRepository.create(parsedData);

  return createdEmployee;
}

export async function deleteEmployee(id: string): Promise<void> {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  if (!id) {
    throw new Error('Employee ID is required for deletion.');
  }

  const employeeRepository = new EmployeeRepository();
  const deletedEmployee = await employeeRepository.delete(id);

  if (!deletedEmployee) {
    throw new Error('Employee not found');
  }
}
