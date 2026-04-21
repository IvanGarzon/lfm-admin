# Users Feature Design

**Date:** 2026-04-22
**Status:** Approved

## Overview

Tenant-scoped Users feature at `/users`. Allows ADMIN users to view, edit, and manage the role/status of all users belonging to their tenant. Follows the same structure as the Customers feature (URL-driven drawer, nuqs filters, paginated table).

---

## Database Schema Changes

### New enum: `UserStatus`

```prisma
enum UserStatus {
  ACTIVE
  INVITED
  SUSPENDED
}
```

### Updated `User` model — new fields

```prisma
status                UserStatus   @default(ACTIVE)
phone                 String?
lastLoginAt           DateTime?    @map("last_login_at") @db.Timestamptz()
deletedAt             DateTime?    @map("deleted_at") @db.Timestamptz()
addedById             String?      @map("added_by_id")
addedBy               User?        @relation("AddedByUser", fields: [addedById], references: [id])
addedUsers            User[]       @relation("AddedByUser")
isTwoFactorEnabled    Boolean      @default(false) @map("is_two_factor_enabled")
twoFactorConfirmation TwoFactorConfirmation?
permissions           String[]     @default([])
policies              String[]     @default([])
```

### Updated `Employee` model — optional User link

```prisma
userId  String?  @unique @map("user_id")
user    User?    @relation(fields: [userId], references: [id])
```

### New `TwoFactorConfirmation` model (was commented out)

```prisma
model TwoFactorConfirmation {
  id     String @id @default(cuid())
  userId String @unique @map("user_id")
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("two_factor_confirmations")
}
```

**Migration required.** All new fields are optional or have defaults — no data loss risk.

`lastLoginAt` is denormalised from the `Session` model to avoid a join on every list render. Updated on each successful authentication.

`permissions[]` and `policies[]` are reserved for future per-user override support. Not wired into `hasPermission()` yet — no UI built for them in this feature.

---

## Roles & Permissions

Existing `UserRole` enum values are unchanged (`USER`, `MANAGER`, `ADMIN`, `SUPER_ADMIN`). Friendly display labels used in UI only:

| DB value | Display label |
| -------- | ------------- |
| USER     | Staff         |
| MANAGER  | Manager       |
| ADMIN    | Admin         |

The Permissions tab in the drawer uses role-based access only — no per-user overrides in this iteration. The read-only permission summary is derived from the existing `PERMISSIONS` constant and `RolePolicies` in `src/lib/permissions.ts`.

---

## Route Structure

```
/users                  # list page — server component
/users/[id]             # same page, drawer auto-opens for that user
```

Access requires `canManageUsers` permission (ADMIN role and above). All actions use `withTenantPermission('canManageUsers')`.

---

## File Structure

```
src/
├── app/(protected)/users/
│   ├── page.tsx                          # server component, fetches initial data
│   └── [id]/
│       └── page.tsx                      # renders UsersList, drawer opens via URL
│
├── features/users/
│   ├── types.ts                          # UserListItem, UserDetail, display label maps
│   ├── constants/
│   │   └── sortable-columns.ts
│   ├── components/
│   │   ├── users-list.tsx                # client shell: table + drawer
│   │   ├── user-columns.tsx              # column defs; name cell = Link to /users/[id]
│   │   ├── user-drawer.tsx               # drawer with Details + Permissions tabs
│   │   ├── user-form.tsx                 # Details tab form
│   │   ├── user-permissions-form.tsx     # Permissions tab: role selector + summary
│   │   └── user-status-badge.tsx
│   └── hooks/
│       └── use-user-queries.ts           # USER_KEYS, useUsers, useUser, mutations
│
├── actions/users/
│   ├── queries.ts                        # getTenantUsers (paginated + filtered)
│   ├── mutations.ts                      # updateUser, updateUserRole, softDeleteUser
│   └── __tests__/
│       ├── queries.test.ts
│       └── mutations.test.ts
│
├── filters/users/
│   └── users-filters.ts                  # nuqs: search, role[], status[], page, perPage, sort
│
├── schemas/
│   └── users.ts                          # UpdateUserSchema, UpdateUserRoleSchema + inferred types
│
└── repositories/
    └── __tests__/
        └── user-repository.integration.ts  # new methods only; real DB, no mocks
```

The `user-repository.ts` already exists — new tenant-scoped methods are added to it.

---

## Data Flow

```
UsersPage (server)
  └── getTenantUsers(searchParams)
        withTenantPermission('canManageUsers')
        → userRepo.findTenantUsers({ tenantId, search, role[], status[], page, perPage, sort })
        → returns UserPagination

UsersList (client)
  ├── useDataTable (nuqs filters, shallow routing)
  ├── user-columns (name cell = Link /users/[id])
  └── UserDrawer (opens when pathname matches /users/[id])
        ├── useUser(id)  ← react-query fetch
        ├── Tab: Details
        │     └── UserForm → useUpdateUser mutation
        └── Tab: Permissions
              └── UserPermissionsForm → useUpdateUserRole mutation
```

---

## Actions

| Action              | HOF                                      | Description                                                        |
| ------------------- | ---------------------------------------- | ------------------------------------------------------------------ |
| `getTenantUsers`    | `withTenantPermission('canManageUsers')` | Paginated, filtered list                                           |
| `getTenantUserById` | `withTenantPermission('canManageUsers')` | Single user for drawer                                             |
| `updateUser`        | `withTenantPermission('canManageUsers')` | Edit firstName, lastName, email, phone, status, isTwoFactorEnabled |
| `updateUserRole`    | `withTenantPermission('canManageUsers')` | Role change only                                                   |
| `softDeleteUser`    | `withTenantPermission('canManageUsers')` | Sets `deletedAt`                                                   |

All actions return `ActionResult<T>`. All wrap logic in try/catch with `handleActionError`. Mutations call `revalidatePath('/users')`.

---

## Repository Methods (new, added to `user-repository.ts`)

| Method                                                                         | Description                                                                      |
| ------------------------------------------------------------------------------ | -------------------------------------------------------------------------------- |
| `findTenantUsers({ tenantId, search, role[], status[], page, perPage, sort })` | Paginated list scoped to tenant; search across firstName, lastName, email, phone |
| `findTenantUserById(id, tenantId)`                                             | Single user, tenant-scoped                                                       |
| `updateTenantUser(id, tenantId, data)`                                         | Update user fields                                                               |
| `updateTenantUserRole(id, tenantId, role)`                                     | Update role only                                                                 |
| `softDeleteTenantUser(id, tenantId)`                                           | Set deletedAt                                                                    |

All queries include `tenantId` in `where`. Soft-deleted users (`deletedAt != null`) are excluded from all list queries.

---

## Schemas (`src/schemas/users.ts`)

```ts
UpdateUserSchema; // firstName, lastName, email, phone, status, isTwoFactorEnabled
UpdateUserRoleSchema; // id, role (UserRole enum)
SoftDeleteUserSchema; // id (cuid)
```

---

## Filters (`src/filters/users/users-filters.ts`)

nuqs search params:

| Param     | Type           | Description                                |
| --------- | -------------- | ------------------------------------------ |
| `search`  | `string`       | Searches firstName, lastName, email, phone |
| `role`    | `UserRole[]`   | Multi-select filter                        |
| `status`  | `UserStatus[]` | Multi-select filter                        |
| `page`    | `integer`      | Pagination                                 |
| `perPage` | `integer`      | Page size                                  |
| `sort`    | `SortingState` | Column sort                                |

---

## Drawer UI

**Header:** UserAvatar + full name + `UserStatusBadge` + user ID with copy button

**Tab 1 — Details:**

- Fields: `firstName`, `lastName`, `email`, `phone`, `status` (dropdown), `isTwoFactorEnabled` (toggle)
- Unsaved changes warning (matches customer drawer behaviour)
- Save / Cancel buttons

**Tab 2 — Permissions:**

- Role selector: Staff (USER) / Manager (MANAGER) / Admin (ADMIN)
- Read-only grouped permission summary derived from `PERMISSIONS` + `RolePolicies` — no extra DB reads
- Save button triggers `updateUserRole`

---

## Tests

**Action unit tests** (`__tests__/queries.test.ts`, `mutations.test.ts`):

- Mock Prisma; test happy path, validation errors, auth failures.

**Repository integration tests** (`user-repository.integration.ts`):

- Real DB via `setupTestDatabaseLifecycle()` + `getTestPrisma()`.
- Fresh tenant in `beforeEach`.
- Cover each method: happy path, not-found, tenant isolation.
- Grouped by method with `// -- methodName ---` section headers.

---

## Out of Scope (this iteration)

- Per-user permission overrides (`permissions[]` / `policies[]` columns exist in DB but no UI)
- Invite new user flow (uses existing invite system in `admin/tenants`)
- `lastLoginAt` update on auth (separate auth hook concern)
- Role rename refactor (USER → Staff etc. at DB level)
- Two-factor authentication flow (field added, full 2FA flow is separate)
