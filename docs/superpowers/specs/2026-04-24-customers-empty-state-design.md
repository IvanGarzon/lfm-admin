# Customers Empty State — Design Spec

**Date:** 2026-04-24

## Goal

Show a rich full-page empty state on the customers list when a new tenant has no customers yet, instead of an empty table.

## Behaviour

Two distinct zero-result scenarios with different treatments:

| Scenario        | Condition                                | Treatment                                                                       |
| --------------- | ---------------------------------------- | ------------------------------------------------------------------------------- |
| True zero-state | `totalItems === 0` AND no active filters | Full-page `EmptyState` (no card)                                                |
| Filtered zero   | `items.length === 0` AND filters active  | Existing "No customers found. Try adjusting your filters." text inside the card |

Active filter detection (in `customers-list.tsx`):

```ts
const hasActiveFilters = Boolean(serverSearchParams.search) || Boolean(serverSearchParams.status);
const isZeroState = initialData.pagination.totalItems === 0 && !hasActiveFilters;
```

## Components

### 1. `src/components/shared/empty-state.tsx`

Reusable generic component. Props:

```ts
interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
}
```

Renders: centred layout, icon in a rounded box, title, description, optional action slot. No card wrapper — full-page feel.

### 2. `customers-list.tsx` changes

- Import `EmptyState` and `Users` icon
- Compute `isZeroState` from `initialData` and `serverSearchParams`
- When `isZeroState`: render page header + `EmptyState` with "Add Customer" button wired to `handleShowCreateModal`
- When not: render as today (`CustomersTable`)

The create drawer (`CustomerDrawer`) remains in the tree regardless so it can open from both the header button and the empty state button.

## Out of scope

- Other features (invoices, quotes, etc.) — customers is the pilot; same `EmptyState` component will be reused later
- Import / bulk-add actions on the empty state
- Illustration/SVG artwork — icon only for now
