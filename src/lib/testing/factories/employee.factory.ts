/**
 * Employee Factory
 *
 * Creates mock employee objects and related data for testing.
 */

import { testIds } from '../id-generator';
import type { CreateEmployeeInput } from '@/schemas/employees';
import type { EmployeeListItem } from '@/features/staff/employees/types';

/**
 * Creates valid employee input data for create mutations.
 */
export function createEmployeeInput(
  overrides: Partial<CreateEmployeeInput> = {},
): CreateEmployeeInput {
  return {
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane.smith@example.com',
    phone: '0412345678',
    status: 'ACTIVE',
    rate: 35,
    gender: 'FEMALE',
    dob: new Date('1990-06-15'),
    avatarUrl: null,
    ...overrides,
  };
}

/**
 * Creates a mock employee list item as returned by searchEmployees or findEmployeeById.
 */
export function createEmployeeListItem(
  overrides: Partial<EmployeeListItem> = {},
): EmployeeListItem {
  return {
    id: testIds.employee(),
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane.smith@example.com',
    phone: '0412345678',
    gender: 'FEMALE',
    dob: new Date('1990-06-15'),
    rate: 35,
    status: 'ACTIVE',
    avatarUrl: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    deletedAt: null,
    ...overrides,
  };
}
