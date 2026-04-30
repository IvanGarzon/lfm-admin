import type { Session } from 'next-auth';

/**
 * Standard result type for server actions
 * Provides consistent error handling across all actions
 */
export type ActionResult<T> =
  | { success: true; data: T; message?: string }
  | {
      success: false;
      error: string;
      statusCode?: number;
      errors?: Record<string, string[]>;
      context?: Record<string, unknown>;
    };

export type AuthenticatedSession = Session & {
  user: NonNullable<Session['user']>;
};

export type AuthenticatedHandler<TInput, TOutput> = (
  session: AuthenticatedSession,
  input: TInput,
) => Promise<ActionResult<TOutput>>;

export type TenantContext = {
  tenantId: string;
  tenantSlug: string;
  userId: string;
  user: AuthenticatedSession['user'];
};

export type TenantHandler<TInput, TOutput> = (
  ctx: TenantContext,
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
