# Customers Empty State Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show a full-page empty state on the customers list when a tenant has zero customers, instead of an empty table card.

**Architecture:** A shared `EmptyState` component handles the UI. `CustomersList` detects the true zero-state (no customers + no active filters) and renders `EmptyState` instead of `CustomersTable`. The existing "No customers found" text inside `CustomersTable` handles filtered-zero separately. No unit tests for the UI components — the vitest environment is `node` (jsdom is commented out in `vitest.config.ts`), so DOM rendering tests are not supported.

**Tech Stack:** Next.js, React, TypeScript, Tailwind CSS, shadcn/ui, Lucide icons

---

## File Map

| Action | Path                                                       | Responsibility                                 |
| ------ | ---------------------------------------------------------- | ---------------------------------------------- |
| Create | `src/components/shared/empty-state.tsx`                    | Generic empty state UI component               |
| Modify | `src/features/crm/customers/components/customers-list.tsx` | Add zero-state detection + render `EmptyState` |

---

### Task 1: Create the shared `EmptyState` component

**Files:**

- Create: `src/components/shared/empty-state.tsx`

- [ ] **Step 1: Create the component**

```tsx
import type { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center gap-3">
      <div className="flex h-16 w-16 items-center justify-center rounded-xl border bg-muted/50">
        <Icon className="h-7 w-7 text-muted-foreground" />
      </div>
      <div className="space-y-1">
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground max-w-xs mx-auto">{description}</p>
      </div>
      {action ? <div className="mt-1">{action}</div> : null}
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
pnpm tsc --noEmit
```

Expected: no errors relating to `empty-state.tsx`

- [ ] **Step 3: Commit**

```bash
git add src/components/shared/empty-state.tsx
git commit -m "feat(ui): add shared EmptyState component"
```

---

### Task 2: Wire `EmptyState` into `CustomersList`

**Files:**

- Modify: `src/features/crm/customers/components/customers-list.tsx`

- [ ] **Step 1: Add imports**

`Button` and `Plus` are already imported in `customers-list.tsx`. Add only the two missing imports:

```tsx
import { Plus, Users } from 'lucide-react'; // add Users to existing lucide import
import { EmptyState } from '@/components/shared/empty-state';
```

- [ ] **Step 2: Add zero-state detection inside the component**

Inside `CustomersList`, after the existing `const { table }` hook call, add:

```tsx
const hasActiveFilters = Boolean(serverSearchParams.search) || Boolean(serverSearchParams.status);
const isZeroState = initialData.pagination.totalItems === 0 && !hasActiveFilters;
```

- [ ] **Step 3: Render the empty state conditionally**

Replace the `<CustomersTable ... />` JSX with:

```tsx
{
  isZeroState ? (
    <EmptyState
      icon={Users}
      title="No customers yet"
      description="Add your first customer to start managing your relationships."
      action={
        <Button onClick={handleShowCreateModal}>
          <Plus className="mr-2 h-4 w-4" />
          Add Customer
        </Button>
      }
    />
  ) : (
    <CustomersTable
      table={table}
      items={initialData.items}
      totalItems={initialData.pagination.totalItems}
    />
  );
}
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
pnpm tsc --noEmit
```

Expected: no errors

- [ ] **Step 5: Commit**

```bash
git add src/features/crm/customers/components/customers-list.tsx
git commit -m "feat(customers): show empty state when no customers exist"
```

---

### Task 3: Manual verification

- [ ] **Step 1: Start the dev server**

```bash
pnpm dev
```

- [ ] **Step 2: Verify zero-state**

Navigate to `/crm/customers` as a tenant with no customers.

Expected: full-page empty state with Users icon, "No customers yet" heading, description, and "Add Customer" button. No table card visible.

- [ ] **Step 3: Verify the "Add Customer" button in empty state opens the drawer**

Click "Add Customer" in the empty state.

Expected: customer create drawer opens (same as clicking the header button).

- [ ] **Step 4: Verify filtered zero-state is unaffected**

On a tenant with customers, type a search term that returns no results.

Expected: table card with toolbar is still visible, shows "No customers found. Try adjusting your filters." text inside.

- [ ] **Step 5: Verify non-zero state is unaffected**

On a tenant with customers and no search filters applied.

Expected: normal table renders, no empty state shown.
