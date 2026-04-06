import type { Session } from 'next-auth';
import type { ErrorCode } from '@/lib/errors';

/**
 * Standard result type for server actions
 * Provides consistent error handling across all actions
 */
export type ActionResult<T> =
  | { success: true; data: T; message?: string }
  | {
      success: false;
      error: string;
      code?: ErrorCode;
      errors?: Record<string, string[]>;
      context?: Record<string, unknown>;
    };

export type AuthenticatedSession = Session & {
  user: NonNullable<Session['user']>;
};

/**
 * A session where the user is authenticated AND belongs to a tenant.
 * SUPER_ADMIN users do not have a tenantId and cannot use this type.
 */
export type TenantSession = Session & {
  user: NonNullable<Session['user']> & {
    tenantId: string;
    tenantSlug: string;
  };
};

export type AuthenticatedHandler<TInput, TOutput> = (
  session: AuthenticatedSession,
  input: TInput,
) => Promise<ActionResult<TOutput>>;

export type UnauthenticatedHandler<TInput, TOutput> = (
  input: TInput,
) => Promise<ActionResult<TOutput>>;

// -- Super Admin Wrapper ----------------------------------------------------

export type SuperAdminSession = AuthenticatedSession & {
  activeTenantId: string | undefined;
};

/**
 * Action result without data (for void operations)
 */
export type ActionResultVoid = ActionResult<void>;
