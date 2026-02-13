/**
 * Session Factory
 *
 * Creates mock session objects for testing authentication and authorization.
 */

import { testIds } from '../id-generator';

type UserRole = 'USER' | 'MANAGER' | 'ADMIN';

interface MockUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: UserRole;
}

interface MockSession {
  id: string;
  user: MockUser;
  expires: string;
}

interface CreateSessionOptions {
  role?: UserRole;
  userId?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
}

/**
 * Creates a mock session with the specified role.
 *
 * @example
 * const session = createMockSession({ role: 'MANAGER' });
 * mockAuth.mockResolvedValue(session);
 */
export function createMockSession(options: CreateSessionOptions = {}): MockSession {
  const {
    role = 'MANAGER',
    userId = testIds.user(),
    email = `test-${role.toLowerCase()}@example.com`,
    firstName = 'Test',
    lastName = role.charAt(0) + role.slice(1).toLowerCase(),
  } = options;

  return {
    id: testIds.session(),
    user: {
      id: userId,
      email,
      firstName,
      lastName,
      role,
    },
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  };
}

/**
 * Pre-built session factories for common test scenarios.
 */
export const mockSessions = {
  /**
   * Creates a session for a USER role (limited permissions).
   */
  user: (overrides?: Partial<CreateSessionOptions>) =>
    createMockSession({ role: 'USER', ...overrides }),

  /**
   * Creates a session for a MANAGER role (standard permissions).
   */
  manager: (overrides?: Partial<CreateSessionOptions>) =>
    createMockSession({ role: 'MANAGER', ...overrides }),

  /**
   * Creates a session for an ADMIN role (full permissions).
   */
  admin: (overrides?: Partial<CreateSessionOptions>) =>
    createMockSession({ role: 'ADMIN', ...overrides }),

  /**
   * Returns null to simulate unauthenticated state.
   */
  unauthenticated: () => null,

  /**
   * Returns a session with null user to simulate invalid session.
   */
  invalidSession: () => ({ user: null }),
} as const;
