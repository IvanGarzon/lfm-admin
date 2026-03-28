import { auth } from '@/auth';
import type { Session } from 'next-auth';
import type { ActionResult } from '@/types/actions';
import { hasActionPermission, type PermissionKey, hasPermission } from './permissions';

// -- Types ------------------------------------------------------------------

type AuthenticatedSession = Session & {
  user: NonNullable<Session['user']>;
};

type AuthenticatedHandler<TInput, TOutput> = (
  session: AuthenticatedSession,
  input: TInput,
) => Promise<ActionResult<TOutput>>;

type UnauthenticatedHandler<TInput, TOutput> = (input: TInput) => Promise<ActionResult<TOutput>>;

// -- Type Guards ------------------------------------------------------------

/**
 * Type guard to check if a session has a valid user.
 * Narrows the type from Session | null to AuthenticatedSession.
 */
function isAuthenticatedSession(session: Session | null): session is AuthenticatedSession {
  return session !== null && session.user !== undefined && session.user !== null;
}

// -- Basic Auth Wrapper -----------------------------------------------------

/**
 * Wraps a server action to require authentication.
 * Automatically checks for valid session and returns error if missing.
 *
 * @example
 * // Simple query action
 * export const getSessions = withAuth<void, SessionWithUser[]>(
 *   async (session) => {
 *     const sessions = await sessionRepo.findActiveSessionsByUserId(session.user.id);
 *     return { success: true, data: sessions };
 *   }
 * );
 *
 * @example
 * // Mutation action with input
 * export const updateProfile = withAuth<UpdateProfileInput, User>(
 *   async (session, data) => {
 *     const user = await userRepo.update(session.user.id, data);
 *     return { success: true, data: user };
 *   }
 * );
 */
export function withAuth<TInput, TOutput>(
  handler: AuthenticatedHandler<TInput, TOutput>,
): UnauthenticatedHandler<TInput, TOutput> {
  return async (input: TInput): Promise<ActionResult<TOutput>> => {
    const session = await auth();

    if (!isAuthenticatedSession(session)) {
      return {
        success: false,
        error: 'You must be signed in to perform this action',
      };
    }

    return handler(session, input);
  };
}

// -- Action Permission Wrapper ----------------------------------------------

/**
 * Wraps a server action to require authentication AND specific action permission.
 * Checks both authentication and action-level permissions from RolePolicies.
 *
 * @param actionName - The action identifier from your permissions.ts (e.g., 'invoices.createInvoice')
 * @param handler - The authenticated handler function
 *
 * @example
 * export const deleteInvoice = withActionPermission<DeleteInvoiceInput, { id: string }>(
 *   'invoices.deleteInvoice',
 *   async (session, data) => {
 *     await invoiceRepo.delete(data.id);
 *     return { success: true, data: { id: data.id } };
 *   }
 * );
 */
export function withActionPermission<TInput, TOutput>(
  actionName: string,
  handler: AuthenticatedHandler<TInput, TOutput>,
): UnauthenticatedHandler<TInput, TOutput> {
  return async (input: TInput): Promise<ActionResult<TOutput>> => {
    const session = await auth();

    if (!isAuthenticatedSession(session)) {
      return {
        success: false,
        error: 'You must be signed in to perform this action',
      };
    }

    if (!hasActionPermission(session.user, actionName)) {
      return {
        success: false,
        error: `You do not have permission to ${actionName}`,
      };
    }

    return handler(session, input);
  };
}

// -- Feature Permission Wrapper ---------------------------------------------

/**
 * Wraps a server action to require authentication AND specific feature permission.
 * Checks both authentication and high-level permissions (e.g., canManageInvoices).
 *
 * @param permission - The permission key from PERMISSIONS
 * @param handler - The authenticated handler function
 *
 * @example
 * export const bulkUpdateInvoices = withPermission<BulkUpdateInput, { count: number }>(
 *   'canManageInvoices',
 *   async (session, data) => {
 *     const count = await invoiceRepo.bulkUpdate(data);
 *     return { success: true, data: { count } };
 *   }
 * );
 */
export function withPermission<TInput, TOutput>(
  permission: PermissionKey,
  handler: AuthenticatedHandler<TInput, TOutput>,
): UnauthenticatedHandler<TInput, TOutput> {
  return async (input: TInput): Promise<ActionResult<TOutput>> => {
    const session = await auth();

    if (!isAuthenticatedSession(session)) {
      return {
        success: false,
        error: 'You must be signed in to perform this action',
      };
    }

    if (!hasPermission(session.user, permission)) {
      return {
        success: false,
        error: 'You do not have permission to perform this action',
      };
    }

    return handler(session, input);
  };
}

// -- Optional Auth Wrapper --------------------------------------------------

/**
 * Wraps a server action where authentication is optional.
 * Handler receives session | null.
 *
 * @example
 * export const getPublicInvoices = withOptionalAuth<void, Invoice[]>(
 *   async (session) => {
 *     // Works for both authenticated and anonymous users
 *     const invoices = await invoiceRepo.getPublic(session?.user?.id);
 *     return { success: true, data: invoices };
 *   }
 * );
 */
export function withOptionalAuth<TInput, TOutput>(
  handler: (session: Session | null, input: TInput) => Promise<ActionResult<TOutput>>,
): UnauthenticatedHandler<TInput, TOutput> {
  return async (input: TInput): Promise<ActionResult<TOutput>> => {
    const session = await auth();
    return handler(session, input);
  };
}
