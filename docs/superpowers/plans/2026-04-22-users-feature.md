# Users Feature Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a tenant-scoped Users feature at `/users` with a paginated, filtered table and a URL-driven drawer (Details + Permissions tabs) following the Customers feature pattern exactly.

**Architecture:** URL-driven drawer via `/users/[id]` route, nuqs filters for search/role/status, server-rendered initial data passed to a client shell. New User fields (status, phone, lastLoginAt, soft-delete, 2FA, permissions/policies arrays) added via Prisma migration. Employee model gets an optional `userId` link.

**Tech Stack:** Next.js (App Router), Prisma, React Query, nuqs, Zod, React Hook Form, shadcn/ui, Vitest

---

## File Map

| Action | Path                                                               |
| ------ | ------------------------------------------------------------------ |
| Modify | `prisma/schema.prisma`                                             |
| Create | `prisma/migrations/<timestamp>_users_feature/migration.sql` (auto) |
| Create | `src/schemas/users.ts`                                             |
| Create | `src/lib/testing/factories/user.factory.ts`                        |
| Modify | `src/lib/testing/factories/index.ts`                               |
| Modify | `src/repositories/user-repository.ts`                              |
| Create | `src/repositories/__tests__/user-repository.integration.ts`        |
| Create | `src/filters/users/users-filters.ts`                               |
| Create | `src/actions/users/queries.ts`                                     |
| Create | `src/actions/users/mutations.ts`                                   |
| Create | `src/actions/users/__tests__/queries.test.ts`                      |
| Create | `src/actions/users/__tests__/mutations.test.ts`                    |
| Create | `src/features/users/types.ts`                                      |
| Create | `src/features/users/constants/sortable-columns.ts`                 |
| Create | `src/features/users/hooks/use-user-queries.ts`                     |
| Create | `src/features/users/components/user-status-badge.tsx`              |
| Create | `src/features/users/components/user-columns.tsx`                   |
| Create | `src/features/users/components/users-list.tsx`                     |
| Create | `src/features/users/components/user-form.tsx`                      |
| Create | `src/features/users/components/user-permissions-form.tsx`          |
| Create | `src/features/users/components/user-drawer.tsx`                    |
| Create | `src/app/(protected)/users/page.tsx`                               |
| Create | `src/app/(protected)/users/[id]/page.tsx`                          |

---

## Task 1: Database Schema Migration

**Files:**

- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Add UserStatus enum and new User fields**

Open `prisma/schema.prisma`. Add the `UserStatus` enum after `UserRole`:

```prisma
enum UserStatus {
  ACTIVE
  INVITED
  SUSPENDED
}
```

Add these fields to the `User` model (after the existing `role` field):

```prisma
  status                UserStatus              @default(ACTIVE)
  phone                 String?
  lastLoginAt           DateTime?               @map("last_login_at") @db.Timestamptz()
  deletedAt             DateTime?               @map("deleted_at") @db.Timestamptz()
  addedById             String?                 @map("added_by_id")
  addedBy               User?                   @relation("AddedByUser", fields: [addedById], references: [id])
  addedUsers            User[]                  @relation("AddedByUser")
  isTwoFactorEnabled    Boolean                 @default(false) @map("is_two_factor_enabled")
  twoFactorConfirmation TwoFactorConfirmation?
  permissions           String[]                @default([])
  policies              String[]                @default([])
```

- [ ] **Step 2: Add Employee → User link**

Add to the `Employee` model (after the existing `tenantId` fields):

```prisma
  userId  String?  @unique @map("user_id")
  user    User?    @relation(fields: [userId], references: [id])
```

Also add the inverse relation to `User` model:

```prisma
  employee  Employee?
```

- [ ] **Step 3: Add TwoFactorConfirmation model**

Remove the commented-out lines (`// isTwoFactorEnabled`, `// twoFactorConfirmation`) from `User` if present, and add this new model after the `User` model:

```prisma
model TwoFactorConfirmation {
  id     String @id @default(cuid())
  userId String @unique @map("user_id")
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("two_factor_confirmations")
}
```

- [ ] **Step 4: Run migration and generate**

```bash
pnpm prisma migrate dev --name users_feature
pnpm prisma generate
```

Expected: migration SQL created, Prisma client regenerated. `prisma/zod/schemas/enums/UserStatus.schema.ts` will be auto-generated — do not create it manually.

- [ ] **Step 5: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/ prisma/zod/
git commit -m "feat(db): add UserStatus enum, user fields, 2FA model, employee user link"
```

---

## Task 2: Zod Schemas

**Files:**

- Create: `src/schemas/users.ts`

- [ ] **Step 1: Create the schemas file**

```typescript
// src/schemas/users.ts
import { z } from 'zod';
import { UserRoleSchema } from '@/zod/schemas/enums/UserRole.schema';
import { UserStatusSchema } from '@/zod/schemas/enums/UserStatus.schema';
import { commonValidators } from '@/lib/validation';

export const UpdateUserSchema = z.object({
  id: z.cuid({ error: 'Invalid user ID' }),
  firstName: commonValidators.name('First name'),
  lastName: commonValidators.name('Last name'),
  email: commonValidators.email(),
  phone: commonValidators.phoneOptional(),
  status: UserStatusSchema,
  isTwoFactorEnabled: z.boolean(),
});

export const UpdateUserRoleSchema = z.object({
  id: z.cuid({ error: 'Invalid user ID' }),
  role: UserRoleSchema,
});

export const SoftDeleteUserSchema = z.object({
  id: z.cuid({ error: 'Invalid user ID' }),
});

export type UpdateUserInput = z.infer<typeof UpdateUserSchema>;
export type UpdateUserRoleInput = z.infer<typeof UpdateUserRoleSchema>;
export type SoftDeleteUserInput = z.infer<typeof SoftDeleteUserSchema>;
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
pnpm tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/schemas/users.ts
git commit -m "feat(schemas): add user update, role, and soft-delete schemas"
```

---

## Task 3: User Test Factory

**Files:**

- Create: `src/lib/testing/factories/user.factory.ts`
- Modify: `src/lib/testing/factories/index.ts`

- [ ] **Step 1: Create the factory**

```typescript
// src/lib/testing/factories/user.factory.ts
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
```

- [ ] **Step 2: Export from factories index**

Open `src/lib/testing/factories/index.ts` and add:

```typescript
export * from './user.factory';
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/testing/factories/user.factory.ts src/lib/testing/factories/index.ts
git commit -m "feat(testing): add user factory"
```

---

## Task 4: Feature Types and Constants

**Files:**

- Create: `src/features/users/types.ts`
- Create: `src/features/users/constants/sortable-columns.ts`

- [ ] **Step 1: Create types**

```typescript
// src/features/users/types.ts
import type { UserRole, UserStatus } from '@/prisma/client';
import type { PaginationMeta } from '@/types/pagination';

export type UserListItem = {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  role: UserRole;
  status: UserStatus;
  lastLoginAt: Date | null;
  createdAt: Date;
  addedBy: { firstName: string; lastName: string } | null;
};

export type UserDetail = UserListItem & {
  isTwoFactorEnabled: boolean;
};

export type UserPagination = {
  items: UserListItem[];
  pagination: PaginationMeta;
};

export type UserFilters = {
  search?: string;
  role?: UserRole[];
  status?: UserStatus[];
  page: number;
  perPage: number;
  sort?: { id: string; desc: boolean }[];
};

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  USER: 'Staff',
  MANAGER: 'Manager',
  ADMIN: 'Admin',
  SUPER_ADMIN: 'Super Admin',
};
```

- [ ] **Step 2: Create sortable columns constant**

```typescript
// src/features/users/constants/sortable-columns.ts
export const SORTABLE_USER_COLUMNS = [
  'firstName',
  'lastName',
  'email',
  'phone',
  'role',
  'status',
  'lastLoginAt',
  'createdAt',
] as const;

export type SortableUserColumn = (typeof SORTABLE_USER_COLUMNS)[number];
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
pnpm tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/features/users/types.ts src/features/users/constants/
git commit -m "feat(users): add feature types and sortable columns constant"
```

---

## Task 5: Repository Methods

**Files:**

- Modify: `src/repositories/user-repository.ts`

- [ ] **Step 1: Add imports and types at the top of `user-repository.ts`**

Add to the existing imports:

```typescript
import { Prisma, User, UserRole, UserStatus, PrismaClient } from '@/prisma/client';
import { getPaginationMetadata } from '@/lib/utils';
import type { UserListItem, UserDetail, UserFilters, UserPagination } from '@/features/users/types';
```

- [ ] **Step 2: Add `findTenantUsers` method to `UserRepository` class**

```typescript
  /**
   * Finds paginated tenant users with optional search and filters.
   * Excludes soft-deleted users.
   */
  async findTenantUsers(params: UserFilters, tenantId: string): Promise<UserPagination> {
    const { search, role, status, page, perPage, sort } = params;

    const where: Prisma.UserWhereInput = {
      tenantId,
      deletedAt: null,
    };

    if (search) {
      const filter: Prisma.StringFilter = {
        contains: search,
        mode: Prisma.QueryMode.insensitive,
      };
      where.OR = [
        { firstName: filter },
        { lastName: filter },
        { email: filter },
        { phone: filter },
      ];
    }

    if (role && role.length > 0) {
      where.role = { in: role };
    }

    if (status && status.length > 0) {
      where.status = { in: status };
    }

    const skip = page > 0 ? perPage * (page - 1) : 0;

    const orderBy: Prisma.UserOrderByWithRelationInput[] =
      sort && sort.length > 0
        ? sort.map(({ id, desc }) => ({ [id]: desc ? 'desc' : 'asc' } as Prisma.UserOrderByWithRelationInput))
        : [{ lastName: 'asc' }, { firstName: 'asc' }];

    const [items, totalItems] = await Promise.all([
      this.prismaClient.user.findMany({
        where,
        orderBy,
        skip,
        take: perPage,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          role: true,
          status: true,
          lastLoginAt: true,
          createdAt: true,
          addedBy: { select: { firstName: true, lastName: true } },
        },
      }),
      this.prismaClient.user.count({ where }),
    ]);

    return {
      items: items as UserListItem[],
      pagination: getPaginationMetadata(totalItems, perPage, page),
    };
  }
```

- [ ] **Step 3: Add `findTenantUserById` method**

```typescript
  /**
   * Finds a single user scoped to a tenant. Returns null if not found or deleted.
   */
  async findTenantUserById(id: string, tenantId: string): Promise<UserDetail | null> {
    const user = await this.prismaClient.user.findFirst({
      where: { id, tenantId, deletedAt: null },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        isTwoFactorEnabled: true,
        lastLoginAt: true,
        createdAt: true,
        addedBy: { select: { firstName: true, lastName: true } },
      },
    });

    return user as UserDetail | null;
  }
```

- [ ] **Step 4: Add `updateTenantUser` method**

```typescript
  /**
   * Updates editable fields on a tenant-scoped user.
   */
  async updateTenantUser(
    id: string,
    tenantId: string,
    data: {
      firstName: string;
      lastName: string;
      email: string;
      phone?: string | null;
      status: UserStatus;
      isTwoFactorEnabled: boolean;
    },
  ): Promise<UserDetail> {
    const user = await this.prismaClient.user.update({
      where: { id, tenantId },
      data,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        isTwoFactorEnabled: true,
        lastLoginAt: true,
        createdAt: true,
        addedBy: { select: { firstName: true, lastName: true } },
      },
    });

    return user as UserDetail;
  }
```

- [ ] **Step 5: Add `updateTenantUserRole` method**

```typescript
  /**
   * Updates only the role of a tenant-scoped user.
   */
  async updateTenantUserRole(id: string, tenantId: string, role: UserRole): Promise<User> {
    return this.prismaClient.user.update({
      where: { id, tenantId },
      data: { role },
    });
  }
```

- [ ] **Step 6: Add `softDeleteTenantUser` method**

```typescript
  /**
   * Soft-deletes a tenant-scoped user by setting deletedAt.
   */
  async softDeleteTenantUser(id: string, tenantId: string): Promise<boolean> {
    const result = await this.prismaClient.user.updateMany({
      where: { id, tenantId, deletedAt: null },
      data: { deletedAt: new Date() },
    });

    return result.count > 0;
  }
```

- [ ] **Step 7: Verify TypeScript compiles**

```bash
pnpm tsc --noEmit
```

Expected: no errors.

- [ ] **Step 8: Commit**

```bash
git add src/repositories/user-repository.ts
git commit -m "feat(users): add tenant-scoped repository methods"
```

---

## Task 6: Repository Integration Tests

**Files:**

- Create: `src/repositories/__tests__/user-repository.integration.ts`

- [ ] **Step 1: Create the integration test file**

```typescript
// src/repositories/__tests__/user-repository.integration.ts
import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { UserRepository } from '../user-repository';
import {
  setupTestDatabaseLifecycle,
  getTestPrisma,
  createTestTenant,
} from '@/lib/testing/integration/database';

setupTestDatabaseLifecycle();

describe('UserRepository (integration)', () => {
  let repository: UserRepository;
  let tenantId: string;

  beforeAll(() => {
    repository = new UserRepository(getTestPrisma());
  });

  beforeEach(async () => {
    ({ id: tenantId } = await createTestTenant({ name: 'User Test Tenant' }));
  });

  async function createUser(
    overrides: {
      email?: string;
      role?: 'USER' | 'MANAGER' | 'ADMIN';
      status?: 'ACTIVE' | 'INVITED' | 'SUSPENDED';
      firstName?: string;
      lastName?: string;
    } = {},
  ) {
    return getTestPrisma().user.create({
      data: {
        firstName: overrides.firstName ?? 'Alex',
        lastName: overrides.lastName ?? 'Taylor',
        email: overrides.email ?? `alex-${Date.now()}@example.com`,
        role: overrides.role ?? 'USER',
        status: overrides.status ?? 'ACTIVE',
        tenantId,
      },
    });
  }

  // -- findTenantUsers -------------------------------------------------------

  describe('findTenantUsers', () => {
    it('returns paginated users for a tenant', async () => {
      await createUser({ email: 'a@test.com' });
      await createUser({ email: 'b@test.com' });

      const result = await repository.findTenantUsers({ page: 1, perPage: 10 }, tenantId);

      expect(result.items.length).toBe(2);
      expect(result.pagination.totalItems).toBe(2);
    });

    it('excludes soft-deleted users', async () => {
      const user = await createUser();
      await getTestPrisma().user.update({
        where: { id: user.id },
        data: { deletedAt: new Date() },
      });

      const result = await repository.findTenantUsers({ page: 1, perPage: 10 }, tenantId);

      expect(result.items.find((u) => u.id === user.id)).toBeUndefined();
    });

    it('filters by search across firstName, lastName, email, phone', async () => {
      await createUser({ firstName: 'Unique', lastName: 'Person', email: 'unique@test.com' });
      await createUser({ email: 'other@test.com' });

      const result = await repository.findTenantUsers(
        { search: 'Unique', page: 1, perPage: 10 },
        tenantId,
      );

      expect(result.items.length).toBe(1);
      expect(result.items[0].firstName).toBe('Unique');
    });

    it('filters by role', async () => {
      await createUser({ role: 'MANAGER', email: 'mgr@test.com' });
      await createUser({ role: 'USER', email: 'usr@test.com' });

      const result = await repository.findTenantUsers(
        { role: ['MANAGER'], page: 1, perPage: 10 },
        tenantId,
      );

      expect(result.items.every((u) => u.role === 'MANAGER')).toBe(true);
    });

    it('filters by status', async () => {
      await createUser({ status: 'SUSPENDED', email: 'sus@test.com' });
      await createUser({ status: 'ACTIVE', email: 'act@test.com' });

      const result = await repository.findTenantUsers(
        { status: ['SUSPENDED'], page: 1, perPage: 10 },
        tenantId,
      );

      expect(result.items.every((u) => u.status === 'SUSPENDED')).toBe(true);
    });

    it('does not return users from other tenants', async () => {
      const { id: otherTenantId } = await createTestTenant({ name: 'Other Tenant' });
      await getTestPrisma().user.create({
        data: {
          firstName: 'Other',
          lastName: 'User',
          email: 'other@tenant.com',
          tenantId: otherTenantId,
        },
      });

      const result = await repository.findTenantUsers({ page: 1, perPage: 10 }, tenantId);

      expect(result.items.find((u) => u.email === 'other@tenant.com')).toBeUndefined();
    });
  });

  // -- findTenantUserById ----------------------------------------------------

  describe('findTenantUserById', () => {
    it('returns user by id', async () => {
      const user = await createUser();

      const result = await repository.findTenantUserById(user.id, tenantId);

      expect(result).not.toBeNull();
      expect(result?.id).toBe(user.id);
    });

    it('returns null when user not found', async () => {
      const result = await repository.findTenantUserById('nonexistent-id', tenantId);

      expect(result).toBeNull();
    });

    it('returns null for soft-deleted user', async () => {
      const user = await createUser();
      await getTestPrisma().user.update({
        where: { id: user.id },
        data: { deletedAt: new Date() },
      });

      const result = await repository.findTenantUserById(user.id, tenantId);

      expect(result).toBeNull();
    });

    it('does not return user from another tenant', async () => {
      const { id: otherTenantId } = await createTestTenant({ name: 'Other Tenant' });
      const otherUser = await getTestPrisma().user.create({
        data: {
          firstName: 'Other',
          lastName: 'User',
          email: 'other@tenant.com',
          tenantId: otherTenantId,
        },
      });

      const result = await repository.findTenantUserById(otherUser.id, tenantId);

      expect(result).toBeNull();
    });
  });

  // -- updateTenantUser ------------------------------------------------------

  describe('updateTenantUser', () => {
    it('updates user fields and returns updated record', async () => {
      const user = await createUser();

      const result = await repository.updateTenantUser(user.id, tenantId, {
        firstName: 'Updated',
        lastName: 'Name',
        email: 'updated@test.com',
        phone: '0400000000',
        status: 'SUSPENDED',
        isTwoFactorEnabled: true,
      });

      expect(result.firstName).toBe('Updated');
      expect(result.status).toBe('SUSPENDED');
      expect(result.isTwoFactorEnabled).toBe(true);
    });
  });

  // -- updateTenantUserRole --------------------------------------------------

  describe('updateTenantUserRole', () => {
    it('updates role only', async () => {
      const user = await createUser({ role: 'USER' });

      await repository.updateTenantUserRole(user.id, tenantId, 'ADMIN');

      const updated = await getTestPrisma().user.findUnique({ where: { id: user.id } });
      expect(updated?.role).toBe('ADMIN');
    });
  });

  // -- softDeleteTenantUser --------------------------------------------------

  describe('softDeleteTenantUser', () => {
    it('sets deletedAt and returns true', async () => {
      const user = await createUser();

      const result = await repository.softDeleteTenantUser(user.id, tenantId);

      expect(result).toBe(true);
      const updated = await getTestPrisma().user.findUnique({ where: { id: user.id } });
      expect(updated?.deletedAt).not.toBeNull();
    });

    it('returns false when user not found', async () => {
      const result = await repository.softDeleteTenantUser('nonexistent-id', tenantId);

      expect(result).toBe(false);
    });

    it('does not delete user from another tenant', async () => {
      const { id: otherTenantId } = await createTestTenant({ name: 'Other Tenant' });
      const otherUser = await getTestPrisma().user.create({
        data: {
          firstName: 'Other',
          lastName: 'User',
          email: 'other@tenant.com',
          tenantId: otherTenantId,
        },
      });

      const result = await repository.softDeleteTenantUser(otherUser.id, tenantId);

      expect(result).toBe(false);
    });
  });
});
```

- [ ] **Step 2: Run integration tests**

```bash
pnpm test:integration src/repositories/__tests__/user-repository.integration.ts
```

Expected: all tests pass.

- [ ] **Step 3: Commit**

```bash
git add src/repositories/__tests__/user-repository.integration.ts
git commit -m "test(users): add user repository integration tests"
```

---

## Task 7: Filters

**Files:**

- Create: `src/filters/users/users-filters.ts`

- [ ] **Step 1: Create the filters file**

```typescript
// src/filters/users/users-filters.ts
import { UserRoleSchema } from '@/zod/schemas/enums/UserRole.schema';
import { UserStatusSchema } from '@/zod/schemas/enums/UserStatus.schema';
import type { UserRole, UserStatus } from '@/prisma/client';
import { getSortingStateParser } from '@/lib/parsers';
import { SORTABLE_USER_COLUMNS } from '@/features/users/constants/sortable-columns';
import {
  createSearchParamsCache,
  parseAsInteger,
  parseAsString,
  parseAsStringEnum,
  parseAsArrayOf,
} from 'nuqs/server';

const sortableColumnIds = new Set(SORTABLE_USER_COLUMNS);

type ExtractDefaults<T extends Record<string, { defaultValue: unknown }>> = {
  [K in keyof T]: T[K]['defaultValue'];
};

function getSearchParamsDefaults<T extends Record<string, { defaultValue: unknown }>>(
  params: T,
): ExtractDefaults<T> {
  return Object.fromEntries(
    Object.entries(params).map(([key, parser]) => [key, parser.defaultValue]),
  ) as ExtractDefaults<T>;
}

export const searchParams = {
  search: parseAsString.withDefault(''),
  page: parseAsInteger.withDefault(1),
  perPage: parseAsInteger.withDefault(20),
  role: parseAsArrayOf(
    parseAsStringEnum<UserRole>(UserRoleSchema.options as UserRole[]),
  ).withDefault([]),
  status: parseAsArrayOf(
    parseAsStringEnum<UserStatus>(UserStatusSchema.options as UserStatus[]),
  ).withDefault([]),
  sort: getSortingStateParser(sortableColumnIds).withDefault([]),
};

export const searchParamsCache = createSearchParamsCache(searchParams);
export const userSearchParamsDefaults = getSearchParamsDefaults(searchParams);
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
pnpm tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/filters/users/
git commit -m "feat(users): add nuqs filter definitions"
```

---

## Task 8: Server Actions

**Files:**

- Create: `src/actions/users/queries.ts`
- Create: `src/actions/users/mutations.ts`

- [ ] **Step 1: Create queries action**

```typescript
// src/actions/users/queries.ts
'use server';

import { SearchParams } from 'nuqs/server';
import { prisma } from '@/lib/prisma';
import { UserRepository } from '@/repositories/user-repository';
import { handleActionError } from '@/lib/error-handler';
import { withTenantPermission } from '@/lib/action-auth';
import type { UserPagination, UserDetail } from '@/features/users/types';
import { searchParamsCache } from '@/filters/users/users-filters';

const userRepo = new UserRepository(prisma);

/**
 * Retrieves a paginated, filtered list of users for the current tenant.
 */
export const getTenantUsers = withTenantPermission<SearchParams, UserPagination>(
  'canManageUsers',
  async (ctx, searchParams) => {
    try {
      const filters = searchParamsCache.parse(searchParams);
      const result = await userRepo.findTenantUsers(filters, ctx.tenantId);
      return { success: true, data: result };
    } catch (error) {
      return handleActionError(error, 'Failed to fetch users');
    }
  },
);

/**
 * Retrieves a single user by ID for the current tenant.
 */
export const getTenantUserById = withTenantPermission<string, UserDetail>(
  'canManageUsers',
  async (ctx, id) => {
    try {
      const user = await userRepo.findTenantUserById(id, ctx.tenantId);
      if (!user) {
        return { success: false, error: 'User not found' };
      }
      return { success: true, data: user };
    } catch (error) {
      return handleActionError(error, 'Failed to fetch user');
    }
  },
);
```

- [ ] **Step 2: Create mutations action**

```typescript
// src/actions/users/mutations.ts
'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { UserRepository } from '@/repositories/user-repository';
import { handleActionError } from '@/lib/error-handler';
import { withTenantPermission } from '@/lib/action-auth';
import {
  UpdateUserSchema,
  UpdateUserRoleSchema,
  SoftDeleteUserSchema,
  type UpdateUserInput,
  type UpdateUserRoleInput,
  type SoftDeleteUserInput,
} from '@/schemas/users';
import type { UserDetail } from '@/features/users/types';
import type { User } from '@/prisma/client';

const userRepo = new UserRepository(prisma);

/**
 * Updates editable fields (name, email, phone, status, 2FA) for a tenant user.
 */
export const updateUser = withTenantPermission<UpdateUserInput, UserDetail>(
  'canManageUsers',
  async (ctx, data) => {
    try {
      const { id, ...fields } = UpdateUserSchema.parse(data);
      const existing = await userRepo.findTenantUserById(id, ctx.tenantId);
      if (!existing) {
        return { success: false, error: 'User not found' };
      }

      const user = await userRepo.updateTenantUser(id, ctx.tenantId, fields);

      revalidatePath('/users');
      revalidatePath(`/users/${id}`);

      return { success: true, data: user };
    } catch (error) {
      return handleActionError(error, 'Failed to update user');
    }
  },
);

/**
 * Updates the role for a tenant user.
 */
export const updateUserRole = withTenantPermission<UpdateUserRoleInput, User>(
  'canManageUsers',
  async (ctx, data) => {
    try {
      const { id, role } = UpdateUserRoleSchema.parse(data);
      const existing = await userRepo.findTenantUserById(id, ctx.tenantId);
      if (!existing) {
        return { success: false, error: 'User not found' };
      }

      const user = await userRepo.updateTenantUserRole(id, ctx.tenantId, role);

      revalidatePath('/users');
      revalidatePath(`/users/${id}`);

      return { success: true, data: user };
    } catch (error) {
      return handleActionError(error, 'Failed to update user role');
    }
  },
);

/**
 * Soft-deletes a tenant user by setting deletedAt.
 */
export const softDeleteUser = withTenantPermission<SoftDeleteUserInput, { id: string }>(
  'canManageUsers',
  async (ctx, data) => {
    try {
      const { id } = SoftDeleteUserSchema.parse(data);
      const deleted = await userRepo.softDeleteTenantUser(id, ctx.tenantId);
      if (!deleted) {
        return { success: false, error: 'User not found' };
      }

      revalidatePath('/users');

      return { success: true, data: { id } };
    } catch (error) {
      return handleActionError(error, 'Failed to delete user');
    }
  },
);
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
pnpm tsc --noEmit
```

Expected: no errors.

---

## Task 9: Action Unit Tests

**Files:**

- Create: `src/actions/users/__tests__/queries.test.ts`
- Create: `src/actions/users/__tests__/mutations.test.ts`

- [ ] **Step 1: Write queries unit tests**

```typescript
// src/actions/users/__tests__/queries.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getTenantUsers, getTenantUserById } from '../queries';
import { testIds, mockSessions } from '@/lib/testing';
import type { UserPagination, UserDetail } from '@/features/users/types';

const { mockUserRepo, mockAuth } = vi.hoisted(() => ({
  mockUserRepo: {
    findTenantUsers: vi.fn(),
    findTenantUserById: vi.fn(),
  },
  mockAuth: vi.fn(),
}));

vi.mock('@/repositories/user-repository', () => ({
  UserRepository: vi.fn().mockImplementation(function () {
    return mockUserRepo;
  }),
}));

vi.mock('@/auth', () => ({ auth: mockAuth }));

vi.mock('@/filters/users/users-filters', () => ({
  searchParamsCache: {
    parse: vi.fn().mockReturnValue({ page: 1, perPage: 20 }),
  },
}));

const TEST_USER_ID = testIds.user();

const mockPagination: UserPagination = {
  items: [
    {
      id: TEST_USER_ID,
      firstName: 'Alex',
      lastName: 'Taylor',
      email: 'alex@example.com',
      phone: null,
      role: 'USER',
      status: 'ACTIVE',
      lastLoginAt: null,
      createdAt: new Date('2024-01-01'),
      addedBy: null,
    },
  ],
  pagination: {
    totalItems: 1,
    totalPages: 1,
    currentPage: 1,
    hasNextPage: false,
    hasPreviousPage: false,
    nextPage: null,
    previousPage: null,
  },
};

const mockUser: UserDetail = {
  id: TEST_USER_ID,
  firstName: 'Alex',
  lastName: 'Taylor',
  email: 'alex@example.com',
  phone: null,
  role: 'USER',
  status: 'ACTIVE',
  isTwoFactorEnabled: false,
  lastLoginAt: null,
  createdAt: new Date('2024-01-01'),
  addedBy: null,
};

describe('User Queries', () => {
  const mockSession = mockSessions.admin();

  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue(mockSession);
  });

  describe('getTenantUsers', () => {
    it('returns paginated users', async () => {
      mockUserRepo.findTenantUsers.mockResolvedValue(mockPagination);

      const result = await getTenantUsers({});

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.items).toHaveLength(1);
      }
    });

    it('returns error when unauthenticated', async () => {
      mockAuth.mockResolvedValue(null);

      const result = await getTenantUsers({});

      expect(result.success).toBe(false);
    });

    it('returns error when user lacks canManageUsers permission', async () => {
      mockAuth.mockResolvedValue(mockSessions.user());

      const result = await getTenantUsers({});

      expect(result.success).toBe(false);
    });
  });

  describe('getTenantUserById', () => {
    it('returns user by id', async () => {
      mockUserRepo.findTenantUserById.mockResolvedValue(mockUser);

      const result = await getTenantUserById(TEST_USER_ID);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe(TEST_USER_ID);
      }
    });

    it('returns error when user not found', async () => {
      mockUserRepo.findTenantUserById.mockResolvedValue(null);

      const result = await getTenantUserById('nonexistent-id');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toMatch(/not found/i);
      }
    });
  });
});
```

- [ ] **Step 2: Write mutations unit tests**

```typescript
// src/actions/users/__tests__/mutations.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { updateUser, updateUserRole, softDeleteUser } from '../mutations';
import { testIds, mockSessions, createUpdateUserInput } from '@/lib/testing';
import { revalidatePath } from 'next/cache';
import type { UserDetail } from '@/features/users/types';

const { mockUserRepo, mockAuth } = vi.hoisted(() => ({
  mockUserRepo: {
    findTenantUserById: vi.fn(),
    updateTenantUser: vi.fn(),
    updateTenantUserRole: vi.fn(),
    softDeleteTenantUser: vi.fn(),
  },
  mockAuth: vi.fn(),
}));

vi.mock('@/repositories/user-repository', () => ({
  UserRepository: vi.fn().mockImplementation(function () {
    return mockUserRepo;
  }),
}));

vi.mock('@/auth', () => ({ auth: mockAuth }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));

const TEST_USER_ID = testIds.user();

const mockUser: UserDetail = {
  id: TEST_USER_ID,
  firstName: 'Alex',
  lastName: 'Taylor',
  email: 'alex@example.com',
  phone: null,
  role: 'USER',
  status: 'ACTIVE',
  isTwoFactorEnabled: false,
  lastLoginAt: null,
  createdAt: new Date('2024-01-01'),
  addedBy: null,
};

const baseInput = createUpdateUserInput({ id: TEST_USER_ID });

describe('User Mutations', () => {
  const mockSession = mockSessions.admin();

  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue(mockSession);
    mockUserRepo.findTenantUserById.mockResolvedValue(mockUser);
  });

  describe('updateUser', () => {
    it('updates user and returns the record', async () => {
      mockUserRepo.updateTenantUser.mockResolvedValue(mockUser);

      const result = await updateUser(baseInput);

      expect(result.success).toBe(true);
      expect(mockUserRepo.updateTenantUser).toHaveBeenCalled();
      expect(revalidatePath).toHaveBeenCalledWith('/users');
      expect(revalidatePath).toHaveBeenCalledWith(`/users/${TEST_USER_ID}`);
    });

    it('returns error when user not found', async () => {
      mockUserRepo.findTenantUserById.mockResolvedValue(null);

      const result = await updateUser(baseInput);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toMatch(/not found/i);
      }
      expect(mockUserRepo.updateTenantUser).not.toHaveBeenCalled();
    });

    it('returns error when unauthenticated', async () => {
      mockAuth.mockResolvedValue(null);

      const result = await updateUser(baseInput);

      expect(result.success).toBe(false);
    });
  });

  describe('updateUserRole', () => {
    it('updates role and returns the user', async () => {
      mockUserRepo.updateTenantUserRole.mockResolvedValue({ ...mockUser, role: 'ADMIN' });

      const result = await updateUserRole({ id: TEST_USER_ID, role: 'ADMIN' });

      expect(result.success).toBe(true);
      expect(mockUserRepo.updateTenantUserRole).toHaveBeenCalledWith(
        TEST_USER_ID,
        mockSession.user.tenantId,
        'ADMIN',
      );
    });

    it('returns error when user not found', async () => {
      mockUserRepo.findTenantUserById.mockResolvedValue(null);

      const result = await updateUserRole({ id: TEST_USER_ID, role: 'ADMIN' });

      expect(result.success).toBe(false);
    });
  });

  describe('softDeleteUser', () => {
    it('soft-deletes user and returns the id', async () => {
      mockUserRepo.softDeleteTenantUser.mockResolvedValue(true);

      const result = await softDeleteUser({ id: TEST_USER_ID });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe(TEST_USER_ID);
      }
      expect(revalidatePath).toHaveBeenCalledWith('/users');
    });

    it('returns error when user not found', async () => {
      mockUserRepo.softDeleteTenantUser.mockResolvedValue(false);

      const result = await softDeleteUser({ id: TEST_USER_ID });

      expect(result.success).toBe(false);
    });
  });
});
```

- [ ] **Step 3: Run unit tests**

```bash
pnpm vitest run src/actions/users/__tests__/
```

Expected: all tests pass.

- [ ] **Step 4: Commit**

```bash
git add src/actions/users/
git commit -m "feat(users): add server actions and unit tests"
```

---

## Task 10: React Query Hooks

**Files:**

- Create: `src/features/users/hooks/use-user-queries.ts`

- [ ] **Step 1: Create the hooks file**

```typescript
// src/features/users/hooks/use-user-queries.ts
'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getTenantUserById } from '@/actions/users/queries';
import { updateUser, updateUserRole, softDeleteUser } from '@/actions/users/mutations';
import type { UpdateUserInput, UpdateUserRoleInput, SoftDeleteUserInput } from '@/schemas/users';
import type { UserDetail } from '@/features/users/types';

export const USER_KEYS = {
  all: ['users'] as const,
  lists: () => [...USER_KEYS.all, 'list'] as const,
  list: (filters: string) => [...USER_KEYS.lists(), { filters }] as const,
  details: () => [...USER_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...USER_KEYS.details(), id] as const,
};

export function useUser(id: string | undefined) {
  return useQuery({
    queryKey: USER_KEYS.detail(id ?? ''),
    queryFn: async () => {
      if (!id) throw new Error('User ID is required');
      const result = await getTenantUserById(id);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    enabled: Boolean(id),
    staleTime: 30 * 1000,
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateUserInput) => {
      const result = await updateUser(data);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    onMutate: async (newData) => {
      await queryClient.cancelQueries({ queryKey: USER_KEYS.detail(newData.id) });
      await queryClient.cancelQueries({ queryKey: USER_KEYS.lists() });
      const previousUser = queryClient.getQueryData(USER_KEYS.detail(newData.id));
      queryClient.setQueryData(USER_KEYS.detail(newData.id), (old: UserDetail | undefined) => {
        if (!old) return old;
        return {
          ...old,
          firstName: newData.firstName,
          lastName: newData.lastName,
          email: newData.email,
          phone: newData.phone ?? null,
          status: newData.status,
          isTwoFactorEnabled: newData.isTwoFactorEnabled,
        };
      });
      return { previousUser };
    },
    onError: (err, newData, context) => {
      if (context?.previousUser) {
        queryClient.setQueryData(USER_KEYS.detail(newData.id), context.previousUser);
      }
      toast.error(err.message || 'Failed to update user');
    },
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({ queryKey: USER_KEYS.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: USER_KEYS.lists() });
    },
    onSuccess: () => {
      toast.success('User updated successfully');
    },
  });
}

export function useUpdateUserRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateUserRoleInput) => {
      const result = await updateUserRole(data);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: USER_KEYS.lists() });
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to update role');
    },
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({ queryKey: USER_KEYS.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: USER_KEYS.lists() });
    },
    onSuccess: () => {
      toast.success('Role updated successfully');
    },
  });
}

export function useSoftDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: SoftDeleteUserInput) => {
      const result = await softDeleteUser(data);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    onMutate: async (data) => {
      await queryClient.cancelQueries({ queryKey: USER_KEYS.detail(data.id) });
      await queryClient.cancelQueries({ queryKey: USER_KEYS.lists() });
      const previousLists = queryClient.getQueriesData({ queryKey: USER_KEYS.lists() });
      queryClient.removeQueries({ queryKey: USER_KEYS.detail(data.id) });
      return { previousLists };
    },
    onError: (err, _data, context) => {
      if (context?.previousLists) {
        context.previousLists.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      toast.error(err.message || 'Failed to delete user');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: USER_KEYS.lists() });
    },
    onSuccess: () => {
      toast.success('User removed');
    },
  });
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
pnpm tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/features/users/hooks/
git commit -m "feat(users): add react query hooks"
```

---

## Task 11: UserStatusBadge Component

**Files:**

- Create: `src/features/users/components/user-status-badge.tsx`

- [ ] **Step 1: Create the badge component**

```tsx
// src/features/users/components/user-status-badge.tsx
import { CheckCircle2, CircleDashed, Ban } from 'lucide-react';
import type { UserStatus } from '@/prisma/client';
import { StatusBadge, type StatusBadgeConfig } from '@/components/shared/status-badge';

type UserStatusBadgeProps = {
  status: UserStatus;
  className?: string;
};

const USER_STATUS_CONFIG: Record<UserStatus, StatusBadgeConfig> = {
  ACTIVE: {
    label: 'Active',
    variant: 'outline',
    className:
      'bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-400 dark:border-green-800',
    icon: <CheckCircle2 className="h-4 w-4" />,
  },
  INVITED: {
    label: 'Invited',
    variant: 'outline',
    className:
      'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-800',
    icon: <CircleDashed className="h-4 w-4" />,
  },
  SUSPENDED: {
    label: 'Suspended',
    variant: 'outline',
    className:
      'bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-400 dark:border-red-800',
    icon: <Ban className="h-4 w-4" />,
  },
};

export function UserStatusBadge({ status, className }: UserStatusBadgeProps) {
  return <StatusBadge status={status} config={USER_STATUS_CONFIG} className={className} />;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/features/users/components/user-status-badge.tsx
git commit -m "feat(users): add UserStatusBadge component"
```

---

## Task 12: User Columns

**Files:**

- Create: `src/features/users/components/user-columns.tsx`

- [ ] **Step 1: Create the columns file**

```tsx
// src/features/users/components/user-columns.tsx
'use client';

import { ColumnDef } from '@tanstack/react-table';
import Link from 'next/link';
import { format } from 'date-fns';
import { Text } from 'lucide-react';
import { Box } from '@/components/ui/box';
import { DataTableColumnHeader } from '@/components/shared/tableV3/data-table-column-header';
import { UserAvatar } from '@/components/shared/user-avatar';
import type { UserListItem } from '@/features/users/types';
import { USER_ROLE_LABELS } from '@/features/users/types';
import { UserStatusBadge } from './user-status-badge';
import { useQueryString } from '@/hooks/use-query-string';
import { searchParams, userSearchParamsDefaults } from '@/filters/users/users-filters';

function UserLink({ userId, name }: { userId: string; name: string }) {
  const queryString = useQueryString(searchParams, userSearchParamsDefaults);
  const basePath = `/users/${userId}`;
  const href = queryString ? `${basePath}?${queryString}` : basePath;

  return (
    <Link href={href} className="font-medium hover:text-primary transition-colors hover:underline">
      {name}
    </Link>
  );
}

export const userColumns: ColumnDef<UserListItem>[] = [
  {
    id: 'search',
    accessorFn: (row) => `${row.firstName} ${row.lastName}`,
    header: ({ column }) => <DataTableColumnHeader column={column} title="User" />,
    cell: ({ row }) => (
      <Box className="flex items-center gap-3">
        <UserAvatar
          user={{ name: `${row.original.firstName} ${row.original.lastName}`, image: null }}
          className="h-8 w-8"
        />
        <Box className="flex flex-col">
          <UserLink
            userId={row.original.id}
            name={`${row.original.firstName} ${row.original.lastName}`}
          />
          <Box className="text-xs text-muted-foreground">{row.original.email}</Box>
        </Box>
      </Box>
    ),
    enableSorting: true,
    enableColumnFilter: true,
    meta: {
      label: 'User',
      placeholder: 'Search users...',
      variant: 'text',
      icon: Text,
    },
  },
  {
    id: 'role',
    accessorKey: 'role',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Role" />,
    cell: ({ row }) => <span className="text-sm">{USER_ROLE_LABELS[row.original.role]}</span>,
    enableSorting: true,
  },
  {
    id: 'status',
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => <UserStatusBadge status={row.original.status} />,
    enableSorting: true,
  },
  {
    id: 'phone',
    accessorKey: 'phone',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Phone" />,
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">{row.original.phone ?? '—'}</span>
    ),
  },
  {
    id: 'lastLoginAt',
    accessorKey: 'lastLoginAt',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Last Login" />,
    cell: ({ row }) =>
      row.original.lastLoginAt ? format(new Date(row.original.lastLoginAt), 'MMM dd, yyyy') : '—',
    enableSorting: true,
  },
  {
    id: 'createdAt',
    accessorKey: 'createdAt',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Added" />,
    cell: ({ row }) => format(new Date(row.original.createdAt), 'MMM dd, yyyy'),
    enableSorting: true,
  },
];
```

- [ ] **Step 2: Commit**

```bash
git add src/features/users/components/user-columns.tsx
git commit -m "feat(users): add user table columns"
```

---

## Task 13: UserForm Component

**Files:**

- Create: `src/features/users/components/user-form.tsx`

- [ ] **Step 1: Create the form**

```tsx
// src/features/users/components/user-form.tsx
'use client';

import { useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { UpdateUserSchema, type UpdateUserInput } from '@/schemas/users';
import { UserStatusSchema } from '@/zod/schemas/enums/UserStatus.schema';
import { Form } from '@/components/ui/form';
import { Field, FieldContent, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Box } from '@/components/ui/box';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useUnsavedChanges } from '@/hooks/use-unsaved-changes';
import type { UserDetail } from '@/features/users/types';

const StatusOptions = UserStatusSchema.options.map((s) => ({
  value: s,
  label: s.charAt(0) + s.slice(1).toLowerCase(),
}));

function mapUserToFormValues(user: UserDetail): UpdateUserInput {
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email ?? '',
    phone: user.phone ?? null,
    status: user.status,
    isTwoFactorEnabled: user.isTwoFactorEnabled,
  };
}

export function UserForm({
  user,
  onUpdate,
  isUpdating = false,
  onDirtyStateChange,
  onClose,
}: {
  user: UserDetail;
  onUpdate: (data: UpdateUserInput) => void;
  isUpdating?: boolean;
  onDirtyStateChange?: (isDirty: boolean) => void;
  onClose?: () => void;
}) {
  const form = useForm<UpdateUserInput>({
    resolver: zodResolver(UpdateUserSchema),
    defaultValues: mapUserToFormValues(user),
  });

  useUnsavedChanges(form.formState.isDirty, onDirtyStateChange);

  const handleSubmit = useCallback(
    (data: UpdateUserInput) => {
      onUpdate(data);
    },
    [onUpdate],
  );

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="flex flex-col h-full">
        <Box className="flex-1 overflow-y-auto p-6 space-y-4">
          <Box className="grid grid-cols-2 gap-4">
            <FieldGroup>
              <Field name="firstName">
                <FieldLabel>First name</FieldLabel>
                <FieldContent>
                  <Input {...form.register('firstName')} />
                </FieldContent>
                <FieldError />
              </Field>
            </FieldGroup>

            <FieldGroup>
              <Field name="lastName">
                <FieldLabel>Last name</FieldLabel>
                <FieldContent>
                  <Input {...form.register('lastName')} />
                </FieldContent>
                <FieldError />
              </Field>
            </FieldGroup>
          </Box>

          <FieldGroup>
            <Field name="email">
              <FieldLabel>Email</FieldLabel>
              <FieldContent>
                <Input type="email" {...form.register('email')} />
              </FieldContent>
              <FieldError />
            </Field>
          </FieldGroup>

          <FieldGroup>
            <Field name="phone">
              <FieldLabel>Phone</FieldLabel>
              <FieldContent>
                <Input {...form.register('phone', { setValueAs: (v) => v || null })} />
              </FieldContent>
              <FieldError />
            </Field>
          </FieldGroup>

          <FieldGroup>
            <Field name="status">
              <FieldLabel>Status</FieldLabel>
              <FieldContent>
                <Select
                  value={form.watch('status')}
                  onValueChange={(v) =>
                    form.setValue('status', v as UpdateUserInput['status'], { shouldDirty: true })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {StatusOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FieldContent>
              <FieldError />
            </Field>
          </FieldGroup>

          <FieldGroup>
            <Field name="isTwoFactorEnabled">
              <Box className="flex items-center justify-between">
                <FieldLabel>Two-factor authentication</FieldLabel>
                <Switch
                  checked={form.watch('isTwoFactorEnabled')}
                  onCheckedChange={(v) =>
                    form.setValue('isTwoFactorEnabled', v, { shouldDirty: true })
                  }
                />
              </Box>
              <FieldError />
            </Field>
          </FieldGroup>
        </Box>

        <Box className="border-t p-4 flex items-center justify-end gap-3">
          {onClose ? (
            <Button type="button" variant="outline" onClick={onClose} disabled={isUpdating}>
              Cancel
            </Button>
          ) : null}
          <Button type="submit" disabled={isUpdating || !form.formState.isDirty}>
            {isUpdating ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
            Save changes
          </Button>
        </Box>
      </form>
    </Form>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/features/users/components/user-form.tsx
git commit -m "feat(users): add UserForm component"
```

---

## Task 14: UserPermissionsForm Component

**Files:**

- Create: `src/features/users/components/user-permissions-form.tsx`

- [ ] **Step 1: Create the permissions form**

```tsx
// src/features/users/components/user-permissions-form.tsx
'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Box } from '@/components/ui/box';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PERMISSIONS, RolePolicies } from '@/lib/permissions';
import type { UserRole } from '@/prisma/client';
import type { UserDetail } from '@/features/users/types';
import { USER_ROLE_LABELS } from '@/features/users/types';
import type { UpdateUserRoleInput } from '@/schemas/users';

const SELECTABLE_ROLES: UserRole[] = ['USER', 'MANAGER', 'ADMIN'];

export function UserPermissionsForm({
  user,
  onUpdate,
  isUpdating = false,
}: {
  user: UserDetail;
  onUpdate: (data: UpdateUserRoleInput) => void;
  isUpdating?: boolean;
}) {
  const [selectedRole, setSelectedRole] = useState<UserRole>(user.role as UserRole);

  const isDirty = selectedRole !== user.role;

  const allowedPermissions = RolePolicies[selectedRole]?.allow ?? [];

  const handleSave = () => {
    onUpdate({ id: user.id, role: selectedRole });
  };

  return (
    <Box className="flex flex-col h-full">
      <Box className="flex-1 overflow-y-auto p-6 space-y-6">
        <Box>
          <p className="text-sm font-medium mb-2">Role</p>
          <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as UserRole)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SELECTABLE_ROLES.map((role) => (
                <SelectItem key={role} value={role}>
                  {USER_ROLE_LABELS[role]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Box>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Permissions for {USER_ROLE_LABELS[selectedRole]}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {allowedPermissions.length === 0 ? (
              <p className="text-sm text-muted-foreground">No permissions assigned.</p>
            ) : (
              <ul className="space-y-2">
                {allowedPermissions.map((key) => (
                  <li key={key} className="flex items-start gap-2 text-sm">
                    <span className="mt-0.5 size-1.5 rounded-full bg-green-500 shrink-0 mt-2" />
                    <span>{PERMISSIONS[key]?.label ?? key}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </Box>

      <Box className="border-t p-4 flex justify-end">
        <Button onClick={handleSave} disabled={isUpdating || !isDirty}>
          {isUpdating ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
          Save role
        </Button>
      </Box>
    </Box>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/features/users/components/user-permissions-form.tsx
git commit -m "feat(users): add UserPermissionsForm component"
```

---

## Task 15: UserDrawer Component

**Files:**

- Create: `src/features/users/components/user-drawer.tsx`

- [ ] **Step 1: Create the drawer**

```tsx
// src/features/users/components/user-drawer.tsx
'use client';

import { useState, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { X, AlertCircle } from 'lucide-react';
import { Box } from '@/components/ui/box';
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useUser, useUpdateUser, useUpdateUserRole } from '@/features/users/hooks/use-user-queries';
import { UserForm } from './user-form';
import { UserPermissionsForm } from './user-permissions-form';
import { UserStatusBadge } from './user-status-badge';
import { UserAvatar } from '@/components/shared/user-avatar';
import { CopyButton } from '@/components/shared/copy-button';
import { useQueryString } from '@/hooks/use-query-string';
import { searchParams, userSearchParamsDefaults } from '@/filters/users/users-filters';
import type { UpdateUserInput, UpdateUserRoleInput } from '@/schemas/users';

export function UserDrawer({ id }: { id: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const { data: user, isLoading, error, isError } = useUser(id);
  const updateUser = useUpdateUser();
  const updateUserRole = useUpdateUserRole();

  const queryString = useQueryString(searchParams, userSearchParamsDefaults);
  const isOpen = pathname?.includes(`/users/${id}`) ?? false;

  const handleOpenChange = useCallback(
    (openState: boolean) => {
      if (!openState) {
        setHasUnsavedChanges(false);
        const basePath = '/users';
        const targetPath = queryString ? `${basePath}?${queryString}` : basePath;
        router.push(targetPath);
      }
    },
    [router, queryString],
  );

  const handleUpdate = useCallback(
    (data: UpdateUserInput) => {
      updateUser.mutate(data, {
        onSuccess: () => setHasUnsavedChanges(false),
      });
    },
    [updateUser],
  );

  const handleUpdateRole = useCallback(
    (data: UpdateUserRoleInput) => {
      updateUserRole.mutate(data);
    },
    [updateUserRole],
  );

  return (
    <Drawer open={isOpen} modal={true} onOpenChange={handleOpenChange}>
      <DrawerContent className="overflow-x-hidden dark:bg-gray-925 pb-0!">
        {isLoading ? (
          <>
            <DrawerHeader>
              <DrawerTitle>User Details</DrawerTitle>
            </DrawerHeader>
            <Box className="p-6">Loading...</Box>
          </>
        ) : null}

        {isError ? (
          <>
            <DrawerHeader>
              <DrawerTitle>Error</DrawerTitle>
            </DrawerHeader>
            <Box className="p-6 text-destructive">
              Could not load user details: {error?.message}
            </Box>
          </>
        ) : null}

        {user && !isLoading && !isError ? (
          <>
            <Box className="-mx-6 flex items-center justify-between gap-x-4 border-b border-gray-200 px-6 pb-4 dark:border-gray-900">
              <Box className="mt-1 flex flex-row items-center gap-4 flex-1">
                <UserAvatar
                  user={{ name: `${user.firstName} ${user.lastName}`, image: null }}
                  className="size-12"
                />
                <Box className="flex flex-col">
                  <Box className="flex items-center gap-2">
                    <DrawerTitle className="text-xl font-semibold tracking-tight">
                      {user.firstName} {user.lastName}
                    </DrawerTitle>
                    {hasUnsavedChanges ? (
                      <span className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1 px-2 py-0.5 rounded-md border border-amber-500 bg-amber-50 dark:bg-amber-900/20">
                        <AlertCircle className="h-3 w-3" />
                        Unsaved changes
                      </span>
                    ) : null}
                  </Box>
                  <Box className="flex items-center gap-2 mt-1">
                    <UserStatusBadge status={user.status} />
                    <Box className="flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                      <span className="font-mono">{user.id}</span>
                      <CopyButton value={user.id} className="size-4 p-0 border-none" />
                    </Box>
                  </Box>
                </Box>
              </Box>

              <Button
                variant="ghost"
                className="aspect-square p-1 text-gray-500 hover:bg-gray-100 hover:dark:bg-gray-400/10"
                onClick={() => handleOpenChange(false)}
              >
                <X className="size-5" aria-hidden="true" />
                <span className="sr-only">Close</span>
              </Button>
            </Box>

            <DrawerBody className="py-0! -mx-6 h-full overflow-hidden">
              <Tabs defaultValue="details" className="flex flex-col h-full">
                <TabsList className="mx-6 mt-4 w-fit">
                  <TabsTrigger value="details">Details</TabsTrigger>
                  <TabsTrigger value="permissions">Permissions</TabsTrigger>
                </TabsList>

                <TabsContent value="details" className="flex-1 overflow-hidden mt-0">
                  <UserForm
                    user={user}
                    onUpdate={handleUpdate}
                    isUpdating={updateUser.isPending}
                    onDirtyStateChange={setHasUnsavedChanges}
                  />
                </TabsContent>

                <TabsContent value="permissions" className="flex-1 overflow-hidden mt-0">
                  <UserPermissionsForm
                    user={user}
                    onUpdate={handleUpdateRole}
                    isUpdating={updateUserRole.isPending}
                  />
                </TabsContent>
              </Tabs>
            </DrawerBody>
          </>
        ) : null}
      </DrawerContent>
    </Drawer>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
pnpm tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/features/users/components/user-drawer.tsx
git commit -m "feat(users): add UserDrawer with Details and Permissions tabs"
```

---

## Task 16: UsersList Component

**Files:**

- Create: `src/features/users/components/users-list.tsx`

- [ ] **Step 1: Create the list component**

```tsx
// src/features/users/components/users-list.tsx
'use client';

import dynamic from 'next/dynamic';
import { useMemo } from 'react';
import { SearchParams } from 'nuqs/server';
import { useDataTable } from '@/hooks/use-data-table';
import { Box } from '@/components/ui/box';
import { Card } from '@/components/ui/card';
import { DataTable } from '@/components/shared/tableV3/data-table';
import { DataTableToolbar } from '@/components/shared/tableV3/data-table-toolbar';
import { userColumns } from '@/features/users/components/user-columns';
import type { UserPagination } from '@/features/users/types';

const UserDrawer = dynamic(
  () => import('@/features/users/components/user-drawer').then((mod) => mod.UserDrawer),
  { ssr: false, loading: () => null },
);

export function UsersList({
  initialData,
  searchParams: serverSearchParams,
  openUserId,
}: {
  initialData: UserPagination;
  searchParams: SearchParams;
  openUserId?: string;
}) {
  const perPage = Number(serverSearchParams.perPage) || 20;
  const pageCount = Math.ceil(initialData.pagination.totalItems / perPage);

  const columns = useMemo(() => userColumns, []);

  const { table } = useDataTable({
    data: initialData.items,
    columns,
    pageCount,
    shallow: false,
    debounceMs: 500,
  });

  return (
    <Box className="space-y-4 min-w-0 w-full">
      <Box className="mb-4">
        <h1 className="text-3xl font-bold tracking-tight">Users</h1>
        <p className="text-muted-foreground text-sm">Manage users and their access</p>
      </Box>

      <Card className="flex w-full flex-col space-y-4 p-4 overflow-hidden min-w-0">
        <DataTableToolbar table={table} />
        {initialData.items.length ? (
          <DataTable table={table} totalItems={initialData.pagination.totalItems} />
        ) : (
          <Box className="text-center py-12 text-muted-foreground">No users found.</Box>
        )}
      </Card>

      {openUserId ? <UserDrawer id={openUserId} /> : null}
    </Box>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/features/users/components/users-list.tsx
git commit -m "feat(users): add UsersList component"
```

---

## Task 17: App Route Pages

**Files:**

- Create: `src/app/(protected)/users/page.tsx`
- Create: `src/app/(protected)/users/[id]/page.tsx`

- [ ] **Step 1: Create the list page**

```tsx
// src/app/(protected)/users/page.tsx
import { SearchParams } from 'nuqs/server';
import { Shell } from '@/components/shared/shell';
import { UsersList } from '@/features/users/components/users-list';
import { getTenantUsers } from '@/actions/users/queries';
import { constructMetadata } from '@/lib/utils';

export const metadata = constructMetadata({
  title: 'Users – lfm dashboard',
  description: 'Manage users and their access.',
});

export default async function UsersPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const searchParamsResolved = await searchParams;
  const result = await getTenantUsers(searchParamsResolved);

  if (!result.success) {
    throw new Error(result.error);
  }

  return (
    <Shell scrollable>
      <UsersList initialData={result.data} searchParams={searchParamsResolved} />
    </Shell>
  );
}
```

- [ ] **Step 2: Create the [id] page**

```tsx
// src/app/(protected)/users/[id]/page.tsx
import { SearchParams } from 'nuqs/server';
import { Shell } from '@/components/shared/shell';
import { UsersList } from '@/features/users/components/users-list';
import { getTenantUsers } from '@/actions/users/queries';

export default async function UserPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const { id } = await params;
  const searchParamsResolved = await searchParams;
  const result = await getTenantUsers(searchParamsResolved);

  if (!result.success) {
    throw new Error(result.error);
  }

  return (
    <Shell scrollable>
      <UsersList initialData={result.data} searchParams={searchParamsResolved} openUserId={id} />
    </Shell>
  );
}
```

- [ ] **Step 3: Verify TypeScript compiles and build passes**

```bash
pnpm tsc --noEmit
pnpm build
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/app/(protected)/users/
git commit -m "feat(users): add app route pages for users list and drawer"
```

---

## Task 18: Smoke Test in Browser

- [ ] **Step 1: Start the dev server**

```bash
pnpm dev
```

- [ ] **Step 2: Verify the following in the browser**

Log in as an ADMIN user and navigate to `/users`.

Checklist:

- [ ] Users table renders with data
- [ ] Search box filters by name, email
- [ ] Role multi-select filter works
- [ ] Status multi-select filter works
- [ ] Clicking a user name navigates to `/users/[id]` and opens the drawer
- [ ] Details tab shows form with user fields
- [ ] Editing fields enables Save button
- [ ] Saving updates the user (toast appears, drawer stays open)
- [ ] Permissions tab shows role selector and permission list
- [ ] Changing role and saving updates it
- [ ] Closing the drawer navigates back to `/users` preserving filters
- [ ] Logging in as a USER role and navigating to `/users` returns a permission error (action-level guard)

- [ ] **Step 3: Final commit**

```bash
git add -A
git commit -m "feat(users): complete users feature with table, filters, and drawer"
```
