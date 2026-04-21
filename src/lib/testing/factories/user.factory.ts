/**
 * User Factory
 *
 * Creates user input fixtures for testing.
 */

import type { UpdateUserInput } from '@/schemas/users';
import { testIds } from '../id-generator';

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
