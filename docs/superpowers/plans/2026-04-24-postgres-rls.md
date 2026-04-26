# PostgreSQL Row-Level Security Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add defence-in-depth tenant isolation at the database layer using PostgreSQL RLS, so cross-tenant data leaks are impossible even if application code has a bug.

**Architecture:** A Prisma migration enables RLS on all 16 parent tables (those with a direct `tenant_id` column). On each request, `withTenant`/`withTenantPermission` HOFs open a DB transaction, execute `set_config('app.tenant_id', tenantId, true)` to set the per-transaction session variable, then store the transaction client in `AsyncLocalStorage`. Repositories read from that storage via a `getTenantDb()` helper, so all queries within the request run against a DB connection where RLS is active.

**Tech Stack:** PostgreSQL (Neon), Prisma 7, Next.js server actions, Node.js `AsyncLocalStorage`

---

## File Map

| File                                                  | Action | Purpose                                                          |
| ----------------------------------------------------- | ------ | ---------------------------------------------------------------- |
| `prisma/migrations/YYYYMMDD_enable_rls/migration.sql` | Create | Enable RLS + tenant isolation policies on 16 tables              |
| `src/lib/tenant-context.ts`                           | Create | `AsyncLocalStorage` for tx client + `getTenantDb()` helper       |
| `src/lib/action-auth.ts`                              | Modify | Wrap handler calls in `$transaction` with `set_config`           |
| `src/repositories/customer-repository.ts`             | Modify | Use `getTenantDb()` in `get model()` and all `this.prisma` calls |
| `src/repositories/organization-repository.ts`         | Modify | Same                                                             |
| `src/repositories/employee-repository.ts`             | Modify | Same                                                             |
| `src/repositories/vendor-repository.ts`               | Modify | Same                                                             |
| `src/repositories/product-repository.ts`              | Modify | Same                                                             |
| `src/repositories/invoice-repository.ts`              | Modify | Same                                                             |
| `src/repositories/quote-repository.ts`                | Modify | Same                                                             |
| `src/repositories/transaction-repository.ts`          | Modify | Same                                                             |
| `src/repositories/recipe-repository.ts`               | Modify | Same                                                             |
| `src/repositories/recipe-group-repository.ts`         | Modify | Same                                                             |
| `src/repositories/price-list-repository.ts`           | Modify | Same                                                             |
| `src/repositories/invitation-repository.ts`           | Modify | Same                                                             |
| `src/repositories/scheduled-task-repository.ts`       | Modify | Same (has tenantId via ScheduledTask model)                      |

**Repositories NOT modified** (no direct `tenant_id` or non-tenant tables):

- `account-repository.ts`, `session-repository.ts`, `user-repository.ts`, `tenant-repository.ts`, `email-audit-repository.ts`, `task-execution-repository.ts`

---

## Task 1: Create tenant context storage

**Files:**

- Create: `src/lib/tenant-context.ts`

- [ ] **Step 1: Create the file**

```ts
import { AsyncLocalStorage } from 'async_hooks';
import type { PrismaClient } from '@/prisma/client';

const tenantDbStorage = new AsyncLocalStorage<PrismaClient>();

/**
 * Returns the transaction-scoped Prisma client for the current request if RLS
 * is active, otherwise falls back to the provided client.
 *
 * @param fallback - The repository's own PrismaClient instance
 * @returns The transaction client if inside a tenant context, else fallback
 */
export function getTenantDb(fallback: PrismaClient): PrismaClient {
  return tenantDbStorage.getStore() ?? fallback;
}

/**
 * Runs a callback inside a tenant DB context.
 * The tx client stored here is the one that has `app.tenant_id` set via set_config.
 *
 * @param tx - The Prisma interactive transaction client
 * @param fn - The async callback to run inside the context
 */
export function runWithTenantDb<T>(tx: PrismaClient, fn: () => Promise<T>): Promise<T> {
  return tenantDbStorage.run(tx, fn);
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/tenant-context.ts
git commit -m "feat(rls): add tenant DB context storage"
```

---

## Task 2: Wire tenant context into HOFs

**Files:**

- Modify: `src/lib/action-auth.ts`

The two HOFs that have tenant context are `withTenant` and `withTenantPermission`. Both call `handler(createContext(...), input)` in two places each (regular user path + super admin path). Each call site gets wrapped in a `$transaction` that sets `app.tenant_id` first and stores the tx client.

- [ ] **Step 1: Add imports to `action-auth.ts`**

At the top, add alongside existing imports:

```ts
import { prisma } from '@/lib/prisma';
import { runWithTenantDb } from '@/lib/tenant-context';
```

- [ ] **Step 2: Create a shared `runTenantAction` helper inside `action-auth.ts`**

Add this private function after the imports, before the exported functions:

```ts
async function runTenantAction<TInput, TOutput>(
  tenantId: string,
  tenantSlug: string,
  userId: string,
  user: AuthenticatedSession['user'],
  handler: TenantHandler<TInput, TOutput>,
  input: TInput,
): Promise<ActionResult<TOutput>> {
  const ctx: TenantContext = { tenantId, tenantSlug, userId, user };
  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT set_config('app.tenant_id', ${tenantId}, true)`;
    return runWithTenantDb(tx as unknown as PrismaClient, () => handler(ctx, input));
  });
}
```

- [ ] **Step 3: Update `withTenant` to use the helper**

Replace both `return handler(createContext(...), input)` calls in `withTenant`:

```ts
// Regular user path — replace:
return handler(createContext(session.user.tenantId, session.user.tenantSlug), input);
// With:
return runTenantAction(
  session.user.tenantId,
  session.user.tenantSlug,
  session.user.id,
  session.user,
  handler,
  input,
);

// Super admin path — replace:
return handler(createContext(tenant.id, tenant.slug), input);
// With:
return runTenantAction(tenant.id, tenant.slug, session.user.id, session.user, handler, input);
```

- [ ] **Step 4: Update `withTenantPermission` — same two replacements**

Apply the identical substitution to both `handler(createContext(...), input)` call sites in `withTenantPermission`. The pattern is identical to Step 3.

- [ ] **Step 5: Verify TypeScript**

```bash
pnpm tsc --noEmit 2>&1 | grep "action-auth\|tenant-context"
```

Expected: no output (no errors).

- [ ] **Step 6: Commit**

```bash
git add src/lib/action-auth.ts
git commit -m "feat(rls): wrap tenant HOFs in transaction with set_config"
```

---

## Task 3: Update repositories to use tenant DB context

Each tenant-scoped repository needs to replace `this.prisma` with `getTenantDb(this.prisma)`. The change is mechanical — same pattern in every file.

**For each repository listed in the file map:**

- [ ] **Step 1: Add import at top of the repository file**

```ts
import { getTenantDb } from '@/lib/tenant-context';
```

- [ ] **Step 2: Update `get model()`**

```ts
// Before:
protected get model() {
  return this.prisma.ENTITY as unknown as ModelDelegateOperations<...>;
}

// After:
protected get model() {
  return getTenantDb(this.prisma).ENTITY as unknown as ModelDelegateOperations<...>;
}
```

Replace `ENTITY` with the appropriate model name (e.g. `customer`, `invoice`, `employee`).

- [ ] **Step 3: Replace all inline `this.prisma.MODEL` references**

Search the file for `this.prisma.` and replace with `getTenantDb(this.prisma).`:

```bash
# To find all occurrences in a file:
grep -n "this\.prisma\." src/repositories/REPO-NAME.ts
```

Each occurrence like:

```ts
// Before:
const result = await this.prisma.customer.findMany({ ... });
// After:
const result = await getTenantDb(this.prisma).customer.findMany({ ... });
```

- [ ] **Step 4: Verify TypeScript for the file**

```bash
pnpm tsc --noEmit 2>&1 | grep "REPO-NAME"
```

Expected: no output.

- [ ] **Step 5: Commit after all repositories are updated**

```bash
git add src/repositories/
git commit -m "feat(rls): use tenant DB context in all tenant-scoped repositories"
```

---

## Task 4: Write the RLS migration

**Files:**

- Create: `prisma/migrations/YYYYMMDD000000_enable_rls/migration.sql`

Replace `YYYYMMDD` with the actual date when implementing.

- [ ] **Step 1: Create the migration directory and SQL file**

```bash
mkdir -p prisma/migrations/$(date +%Y%m%d)000000_enable_rls
```

- [ ] **Step 2: Write the migration SQL**

Create `prisma/migrations/YYYYMMDD000000_enable_rls/migration.sql` with:

```sql
-- Enable Row Level Security on all tenant-scoped parent tables.
-- Policies use a per-transaction session variable set by the application layer
-- via: SELECT set_config('app.tenant_id', $tenantId, true)
-- The 'true' flag scopes the variable to the current transaction only,
-- which is safe with Neon's pgBouncer in transaction mode.

-- Customer
ALTER TABLE "Customer" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Customer" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "Customer"
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Organization
ALTER TABLE "Organization" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Organization" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "Organization"
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Vendor
ALTER TABLE "Vendor" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Vendor" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "Vendor"
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Employee
ALTER TABLE "Employee" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Employee" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "Employee"
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Product
ALTER TABLE "Product" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Product" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "Product"
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Invoice
ALTER TABLE "Invoice" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Invoice" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "Invoice"
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Quote
ALTER TABLE "Quote" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Quote" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "Quote"
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Transaction
ALTER TABLE "Transaction" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Transaction" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "Transaction"
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- TransactionCategory
ALTER TABLE "TransactionCategory" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TransactionCategory" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "TransactionCategory"
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Recipe
ALTER TABLE "Recipe" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Recipe" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "Recipe"
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- RecipeUnit
ALTER TABLE "RecipeUnit" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "RecipeUnit" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "RecipeUnit"
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- RecipeGroup
ALTER TABLE "RecipeGroup" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "RecipeGroup" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "RecipeGroup"
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- PriceListItem
ALTER TABLE "PriceListItem" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PriceListItem" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "PriceListItem"
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- TenantSettings
ALTER TABLE "TenantSettings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TenantSettings" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "TenantSettings"
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- ScheduledTask
ALTER TABLE "ScheduledTask" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ScheduledTask" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "ScheduledTask"
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Invitation
ALTER TABLE "Invitation" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Invitation" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "Invitation"
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Grant BYPASSRLS to the Prisma DB role for non-tenant operations
-- (e.g. Tenant lookup, User auth, Session management).
-- Replace 'prisma_user' with the actual DB role used in your DATABASE_URL.
-- ALTER ROLE prisma_user BYPASSRLS;
-- NOTE: uncomment the line above only if needed. BYPASSRLS means the role
-- skips ALL policies — confirm your DATABASE_URL role before enabling.
```

- [ ] **Step 3: Apply the migration to the database**

```bash
pnpm prisma migrate resolve --applied YYYYMMDD000000_enable_rls
```

Or if applying to dev:

```bash
pnpm prisma db execute --file prisma/migrations/YYYYMMDD000000_enable_rls/migration.sql --schema prisma/schema.prisma
```

- [ ] **Step 4: Verify RLS is active in Neon console or psql**

```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public' AND rowsecurity = true;
```

Expected: 16 rows, one per table above.

- [ ] **Step 5: Commit**

```bash
git add prisma/migrations/
git commit -m "feat(rls): enable row level security on tenant-scoped tables"
```

---

## Task 5: Smoke test end-to-end

No new test files — this verifies the existing app still works with RLS active.

- [ ] **Step 1: Run the dev server**

```bash
pnpm dev
```

- [ ] **Step 2: Log in as a regular tenant user and verify data loads**

Navigate to Customers, Invoices, Employees, Quotes. All should load normally.

- [ ] **Step 3: Log in as SUPER_ADMIN, switch tenants, verify data is scoped**

Use the tenant switcher. Confirm data changes per tenant and no cross-tenant rows appear.

- [ ] **Step 4: Run existing integration tests**

```bash
pnpm vitest run --reporter=verbose
```

Expected: all existing tests pass. Integration tests hit a real DB — if RLS blocks them, the test DB user may need `BYPASSRLS` (see migration SQL comment).

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "feat(rls): postgres row level security — defence-in-depth tenant isolation"
```
