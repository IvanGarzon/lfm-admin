import { cache } from 'react';
import { cookies } from 'next/headers';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import type { Session } from 'next-auth';
import type {
  ActionResult,
  SuperAdminSession,
  AuthenticatedSession,
  AuthenticatedHandler,
  TenantHandler,
  TenantContext,
  UnauthenticatedHandler,
} from '@/types/actions';
import { type PermissionKey, hasPermission } from './permissions';

export const SUPER_ADMIN_TENANT_COOKIE = 'sa_active_tenant_id';

/**
 * Cached session getter - memoizes auth() calls within a single request.
 * Prevents redundant JWT verification when multiple actions are called.
 */
const getSession = cache(async (): Promise<Session | null> => {
  return auth();
});

/**
 * Type guard to check if a session has a valid user.
 * Narrows the type from Session | null to AuthenticatedSession.
 */
function isAuthenticatedSession(session: Session | null): session is AuthenticatedSession {
  return session !== null && session.user !== undefined && session.user !== null;
}

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
    const session = await getSession();

    if (!isAuthenticatedSession(session)) {
      return {
        success: false,
        error: 'You must be signed in to perform this action',
      };
    }

    return handler(session, input);
  };
}

// -- Tenant + Permission Wrapper --------------------------------------------

/**
 * Wraps a server action to require authentication, a valid tenant context,
 * AND specific feature permission(s).
 *
 * Use this for all tenant-scoped business entity actions (invoices, quotes, etc.)
 * where both role-based permission checking and tenant isolation are needed.
 *
 * @example
 * export const getInvoices = withTenantPermission<SearchParams, InvoicePagination>(
 *   'canReadInvoices',
 *   async (ctx, input) => {
 *     const result = await invoiceRepo.searchAndPaginate(input, ctx.tenantId);
 *     return { success: true, data: result };
 *   }
 * );
 */
export function withTenantPermission<TInput, TOutput>(
  permission: PermissionKey | PermissionKey[],
  handler: TenantHandler<TInput, TOutput>,
): UnauthenticatedHandler<TInput, TOutput> {
  return async (input: TInput): Promise<ActionResult<TOutput>> => {
    const session = await getSession();

    if (!isAuthenticatedSession(session)) {
      return {
        success: false,
        error: 'You must be signed in to perform this action',
      };
    }

    const permissions = Array.isArray(permission) ? permission : [permission];
    const missingPermissions = permissions.filter((p) => !hasPermission(session.user, p));

    if (missingPermissions.length > 0) {
      return {
        success: false,
        error: 'You do not have permission to perform this action',
      };
    }

    const createContext = (tenantId: string, tenantSlug: string): TenantContext => ({
      tenantId,
      tenantSlug,
      userId: session.user.id,
      user: session.user,
    });

    if (session.user.tenantId && session.user.tenantSlug) {
      return handler(createContext(session.user.tenantId, session.user.tenantSlug), input);
    }

    // SUPER_ADMIN has no tenantId in JWT — resolve from active tenant cookie
    if (session.user.role === 'SUPER_ADMIN') {
      const tenant = await resolveTenantForSuperAdmin();
      if (!tenant) {
        return {
          success: false,
          error: 'No tenant selected. Use the tenant switcher in the sidebar.',
        };
      }
      return handler(createContext(tenant.id, tenant.slug), input);
    }

    return { success: false, error: 'No tenant context found for this session' };
  };
}

// -- Tenant Context Resolution ----------------------------------------------

/**
 * For SUPER_ADMIN users with no tenantId in their JWT, resolves tenant context
 * from the sa_active_tenant_id cookie. Returns null if no active tenant is set.
 */
async function resolveTenantForSuperAdmin(): Promise<{ id: string; slug: string } | null> {
  const cookieStore = await cookies();
  const tenantId = cookieStore.get(SUPER_ADMIN_TENANT_COOKIE)?.value;
  if (!tenantId) return null;

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { id: true, slug: true },
  });

  return tenant ?? null;
}

// -- Tenant Auth Wrapper ----------------------------------------------------

/**
 * Wraps a server action to require authentication AND a valid tenant context.
 * For regular users, tenant context comes from the JWT.
 * For SUPER_ADMIN, tenant context is resolved from the sa_active_tenant_id cookie.
 *
 * Use this for all actions that operate on tenant-scoped data.
 *
 * @example
 * export const getInvoices = withTenant<SearchParams, InvoicePagination>(
 *   async ({ tenantId }, input) => {
 *     const result = await invoiceRepo.searchAndPaginate(input, tenantId);
 *     return { success: true, data: result };
 *   }
 * );
 */
export function withTenant<TInput, TOutput>(
  handler: TenantHandler<TInput, TOutput>,
): UnauthenticatedHandler<TInput, TOutput> {
  return async (input: TInput): Promise<ActionResult<TOutput>> => {
    const session = await getSession();

    if (!isAuthenticatedSession(session)) {
      return { success: false, error: 'You must be signed in to perform this action' };
    }

    const createContext = (tenantId: string, tenantSlug: string): TenantContext => ({
      tenantId,
      tenantSlug,
      userId: session.user.id,
      user: session.user,
    });

    if (session.user.tenantId && session.user.tenantSlug) {
      return handler(createContext(session.user.tenantId, session.user.tenantSlug), input);
    }

    // SUPER_ADMIN has no tenantId in JWT — resolve from active tenant cookie
    if (session.user.role === 'SUPER_ADMIN') {
      const tenant = await resolveTenantForSuperAdmin();
      if (!tenant) {
        return {
          success: false,
          error: 'No tenant selected. Use the tenant switcher in the sidebar.',
        };
      }
      return handler(createContext(tenant.id, tenant.slug), input);
    }

    return { success: false, error: 'No tenant context found for this session' };
  };
}

/**
 * Wraps a server action to require SUPER_ADMIN role.
 * Reads the `sa_active_tenant_id` cookie and injects `activeTenantId` into the session.
 *
 * @example
 * export const getAdminTenants = withSuperAdmin<void, TenantListItem[]>(
 *   async (session) => {
 *     const tenants = await tenantRepo.findAll();
 *     return { success: true, data: tenants };
 *   }
 * );
 */
export function withSuperAdmin<TInput, TOutput>(
  handler: (session: SuperAdminSession, input: TInput) => Promise<ActionResult<TOutput>>,
): UnauthenticatedHandler<TInput, TOutput> {
  return async (input: TInput): Promise<ActionResult<TOutput>> => {
    const session = await getSession();

    if (!isAuthenticatedSession(session)) {
      return { success: false, error: 'You must be signed in to perform this action' };
    }

    if (session.user.role !== 'SUPER_ADMIN') {
      return { success: false, error: 'You do not have permission to perform this action' };
    }

    const cookieStore = await cookies();
    const activeTenantId = cookieStore.get(SUPER_ADMIN_TENANT_COOKIE)?.value;

    return handler({ ...session, activeTenantId }, input);
  };
}
