/**
 * Session Factory
 *
 * Creates mock session objects for testing authentication and authorisation,
 * plus input and result factories for session action tests.
 */

import { testIds } from '../id-generator';
import type {
  DeleteSessionInput,
  DeleteSessionsInput,
  UpdateSessionNameInput,
  DeleteOtherSessionsInput,
  ExtendSessionInput,
} from '@/schemas/sessions';
import type { SessionWithUser } from '@/features/sessions/types';

// -- Auth mock sessions -------------------------------------------------------

type UserRole = 'USER' | 'MANAGER' | 'ADMIN' | 'SUPER_ADMIN';

interface MockUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: UserRole;
  tenantId: string;
  tenantSlug: string;
}

interface MockSession {
  id: string;
  sessionToken: string;
  user: MockUser;
  expires: string;
}

interface CreateSessionOptions {
  role?: UserRole;
  userId?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  tenantId?: string;
  tenantSlug?: string;
  sessionToken?: string;
}

/**
 * Creates a mock auth session with the specified role.
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
    tenantId = testIds.tenant(),
    tenantSlug = 'test-tenant',
    sessionToken = `token-${testIds.session()}`,
  } = options;

  return {
    id: testIds.session(),
    sessionToken,
    user: {
      id: userId,
      email,
      firstName,
      lastName,
      role,
      tenantId,
      tenantSlug,
    },
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  };
}

/**
 * Pre-built session factories for common test scenarios.
 */
export const mockSessions = {
  /** Creates a session for a USER role (limited permissions). */
  user: (overrides?: Partial<CreateSessionOptions>) =>
    createMockSession({ role: 'USER', ...overrides }),

  /** Creates a session for a MANAGER role (standard permissions). */
  manager: (overrides?: Partial<CreateSessionOptions>) =>
    createMockSession({ role: 'MANAGER', ...overrides }),

  /** Creates a session for an ADMIN role (full permissions). */
  admin: (overrides?: Partial<CreateSessionOptions>) =>
    createMockSession({ role: 'ADMIN', ...overrides }),

  /** Returns null to simulate unauthenticated state. */
  unauthenticated: () => null,

  /** Returns a session with null user to simulate invalid session. */
  invalidSession: () => ({ user: null }),
} as const;

// -- Session action input factories ------------------------------------------

/**
 * Creates valid input for deleteSession.
 */
export function createDeleteSessionInput(
  overrides: Partial<DeleteSessionInput> = {},
): DeleteSessionInput {
  return {
    sessionId: testIds.session(),
    ...overrides,
  };
}

/**
 * Creates valid input for deleteSessions (bulk).
 */
export function createDeleteSessionsInput(
  overrides: Partial<DeleteSessionsInput> = {},
): DeleteSessionsInput {
  return {
    sessionIds: [testIds.session()],
    ...overrides,
  };
}

/**
 * Creates valid input for updateSessionName.
 */
export function createUpdateSessionNameInput(
  overrides: Partial<UpdateSessionNameInput> = {},
): UpdateSessionNameInput {
  return {
    sessionId: testIds.session(),
    deviceName: 'MacBook Pro',
    ...overrides,
  };
}

/**
 * Creates valid input for deleteOtherSessions.
 */
export function createDeleteOtherSessionsInput(
  overrides: Partial<DeleteOtherSessionsInput> = {},
): DeleteOtherSessionsInput {
  return {
    currentSessionId: testIds.session(),
    ...overrides,
  };
}

/**
 * Creates valid input for extendSession.
 */
export function createExtendSessionInput(
  overrides: Partial<ExtendSessionInput> = {},
): ExtendSessionInput {
  return {
    sessionId: testIds.session(),
    ...overrides,
  };
}

// -- Session result factories ------------------------------------------------

/**
 * Creates a mock SessionWithUser as returned by findActiveSessionsByUserId.
 */
export function createSessionWithUser(overrides: Partial<SessionWithUser> = {}): SessionWithUser {
  return {
    id: testIds.session(),
    sessionToken: `token-${testIds.session()}`,
    userId: testIds.user(),
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    lastActiveAt: null,
    ipAddress: null,
    userAgent: null,
    deviceName: null,
    deviceType: null,
    deviceVendor: null,
    deviceModel: null,
    browserName: null,
    browserVersion: null,
    osName: null,
    osVersion: null,
    country: null,
    region: null,
    city: null,
    latitude: null,
    longitude: null,
    timezone: null,
    user: { firstName: 'Test', lastName: 'User' },
    isCurrent: false,
    ...overrides,
  };
}
