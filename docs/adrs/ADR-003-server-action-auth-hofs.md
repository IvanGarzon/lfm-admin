# ADR 003: Server Action Authentication via Higher-Order Functions

Status: Accepted

## Context

Next.js server actions are plain async functions — they have no built-in auth layer. Without a consistent pattern, auth checks are duplicated or forgotten. In a multi-tenant app, forgetting to check `tenantId` can expose one tenant's data to another.

We also have a SUPER_ADMIN role that can impersonate any tenant. This role has no `tenantId` in its JWT (it would need to be re-issued every time a tenant changes), so it resolves the active tenant from a cookie instead.

## Decision

Every server action must be wrapped in one of four higher-order functions from `@/lib/action-auth`:

| HOF                           | When to use                                                                 |
| ----------------------------- | --------------------------------------------------------------------------- |
| `withAuth`                    | Authenticated user, no tenant required (e.g. profile, session management)   |
| `withTenant`                  | Tenant-scoped data, no permission check (e.g. dropdown lookups)             |
| `withTenantPermission('key')` | Tenant-scoped data with RBAC check — use for all writes and sensitive reads |
| `withSuperAdmin`              | Super-admin only operations (e.g. tenant management)                        |

Each HOF:

- Validates the session and returns `{ success: false, error }` immediately if the check fails
- Injects a typed `session` or `TenantContext` into the handler — the action never reads raw session data
- Handles the SUPER_ADMIN cookie-based tenant resolution transparently

## Justification

- Auth is enforced structurally — there is no way to export an action without choosing a HOF.
- The handler signature makes the auth contract explicit: `withTenant` gives you `ctx.tenantId`; `withAuth` gives you `session.user.id`. No ad-hoc session reading.
- SUPER_ADMIN impersonation is centralised. Cookie resolution happens once, in the HOF, not scattered across actions.
- Session memoisation (`cache()` from React) prevents redundant JWT verification when multiple actions are called in a single request.

## Alternatives

- **Middleware only**: Next.js middleware can block unauthenticated routes but cannot inject typed context into individual actions. Rejected — too coarse-grained for per-action permission checks.
- **Manual session check in each action**: Duplicated, inconsistent, and easy to forget. Rejected.
- **Storing tenantId in JWT for SUPER_ADMIN**: Would require re-issuing the JWT on every tenant switch. Rejected — cookie-based active tenant is simpler and avoids re-auth.

## Consequences

- Actions that skip a HOF wrapper will fail type-checking — `ActionResult<T>` is the only valid return type.
- Adding a new permission key requires updating `src/lib/permissions.ts`.
- SUPER_ADMIN actions that need tenant context must use `withTenantPermission` or `withTenant`, not `withSuperAdmin` — the latter does not resolve a full `TenantContext`.
