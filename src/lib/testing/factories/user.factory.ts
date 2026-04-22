/**
 * User Factory
 *
 * Creates user input fixtures for testing.
 */

import type { UpdateUserInput } from '@/schemas/users';
import type { UserListItem } from '@/features/users/types';
import { testIds } from '../id-generator';

/**
 * Creates user data for direct Prisma user creation in integration tests.
 * Does not include tenantId — callers must supply it.
 */
export function createUserData(
  overrides: Partial<
    Pick<UserListItem, 'firstName' | 'lastName' | 'email' | 'role' | 'status'>
  > = {},
): Pick<UserListItem, 'firstName' | 'lastName' | 'email' | 'role' | 'status'> {
  return {
    firstName: 'Alex',
    lastName: 'Taylor',
    email: `alex-${Date.now()}@example.com`,
    role: 'USER',
    status: 'ACTIVE',
    ...overrides,
  };
}

export function createUpdateUserInput(overrides: Partial<UpdateUserInput> = {}): UpdateUserInput {
  return {
    id: testIds.user(),
    firstName: 'Alex',
    lastName: 'Taylor',
    email: 'alex@example.com',
    phone: null,
    status: 'ACTIVE',
    isTwoFactorEnabled: false,
    ...overrides,
  };
}
