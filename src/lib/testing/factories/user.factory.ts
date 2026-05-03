/**
 * User Factory
 *
 * Creates user input and list item fixtures for testing.
 */

import type { UpdateUserInput } from '@/schemas/users';
import type { UserDetail, UserListItem } from '@/features/users/types';
import { testIds } from '../id-generator';

export function createUserListItem(overrides: Partial<UserListItem> = {}): UserListItem {
  return {
    id: testIds.user(),
    firstName: 'Alex',
    lastName: 'Taylor',
    email: 'alex@example.com',
    phone: null,
    role: 'USER',
    status: 'ACTIVE',
    lastLoginAt: null,
    avatarUrl: null,
    addedBy: null,
    ...overrides
  };
}

export function createUserDetail(overrides: Partial<UserDetail> = {}): UserDetail {
  return {
    id: testIds.user(),
    firstName: 'Alex',
    lastName: 'Taylor',
    email: 'alex@example.com',
    phone: null,
    role: 'USER',
    status: 'ACTIVE',
    lastLoginAt: null,
    avatarUrl: null,
    addedBy: null,
    isTwoFactorEnabled: false,
    loginNotificationsEnabled: false,
    username: null,
    title: null,
    bio: null,
    ...overrides
  };
}

/**
 * Creates user data for direct Prisma user creation in integration tests.
 * Does not include tenantId — callers must supply it.
 */
export function createUserData(
  overrides: Partial<
    Pick<UserListItem, 'firstName' | 'lastName' | 'email' | 'role' | 'status'>
  > = {}
): Pick<UserListItem, 'firstName' | 'lastName' | 'email' | 'role' | 'status'> {
  return {
    firstName: 'Alex',
    lastName: 'Taylor',
    email: `alex-${Date.now()}@example.com`,
    role: 'USER',
    status: 'ACTIVE',
    ...overrides
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
    ...overrides
  };
}
