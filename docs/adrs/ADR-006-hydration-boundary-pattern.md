# ADR 006: HydrationBoundary Pattern for List Pages

Status: Accepted

## Context

Early list pages fetched data in the server component and passed it to the client component via an `initialData` prop. This worked, but had two structural problems:

1. **Stale initial data.** `initialData` bypasses React Query's staleness tracking. The cache treats it as always-fresh until explicitly invalidated, so client-side refetches after mutations could silently use outdated data.
2. **Double ownership.** The server component fetched data and handed it off as a plain value. The client component had a React Query hook for mutations — but that hook's query key was disconnected from the initial data. After a mutation, the list would refetch via the hook, but the hydration story was implicit and fragile.

We also had an FOUC (flash of uncached content) problem: navigating to a list page with `initialData` still triggered the client-side query on mount if the data was stale, causing a brief spinner even though the server had already fetched the data.

## Decision

All list pages (and detail pages with server-fetchable data) must use the `HydrationBoundary` + `prefetchQuery` pattern.

### Pattern

```typescript
// src/app/(protected)/entity/page.tsx
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { ENTITY_KEYS } from '@/features/entity/constants/query-keys';
import { getEntities } from '@/actions/entity/queries';

export default async function EntitiesPage({ searchParams }: { searchParams: Promise<SearchParamsType> }) {
  const resolvedParams = await searchParams;
  const queryClient = getQueryClient();

  await queryClient.prefetchQuery({
    queryKey: ENTITY_KEYS.list(resolvedParams),
    queryFn: async () => {
      const result = await getEntities(resolvedParams);
      if (!result.success) throw new Error(result.error);
      return result.data;
    }
  });

  return (
    <Shell scrollable>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <EntityList searchParams={resolvedParams} />
      </HydrationBoundary>
    </Shell>
  );
}
```

The client component renders with data already in cache — no spinner on first load. After mutations, the existing invalidation logic in hooks refetches normally.

### Query client

`getQueryClient` in `src/lib/query-client.ts` uses React `cache()` to return one `QueryClient` per request. This means multiple `prefetchQuery` calls in the same page component share a single in-request cache without any explicit coordination.

### Query keys

Every feature must export an `ENTITY_KEYS` constant from `src/features/entity/constants/query-keys.ts` with this shape:

```typescript
export const ENTITY_KEYS = {
  all: ['entities'],
  lists: () => [...ENTITY_KEYS.all, 'list'],
  list: (filters: unknown) => [...ENTITY_KEYS.lists(), filters],
  details: () => [...ENTITY_KEYS.all, 'detail'],
  detail: (id: string) => [...ENTITY_KEYS.details(), id]
} as const;
```

The `list` key must accept the resolved search params object (or a serialised form of it) so that the server-prefetched cache entry and the client hook's query key match exactly.

## Justification

- **No flash on navigation.** Data is already in the dehydrated cache when React mounts the page — `useQuery` hits the cache immediately.
- **Staleness is tracked correctly.** `prefetchQuery` writes the data with a timestamp. The client's `staleTime` config governs whether a background refetch fires, just as it would for any other cache entry.
- **Mutations integrate cleanly.** Hook `onSettled` invalidates the list key. The next `useQuery` refetch happens normally — no prop threading or initialData collision.
- **Multiple prefetches are free.** A detail page that needs both the entity and its sub-resources can call `await Promise.all([queryClient.prefetchQuery(...), queryClient.prefetchQuery(...)])` — both land in the same request-scoped cache.

## Alternatives

- **`initialData` prop**: Rejected (see Context). Stale-time bypass and disconnected cache ownership cause subtle bugs after mutations.
- **Server Components with no React Query**: Would require moving mutations to server actions and removing client interactivity (drawers, inline edits). Too large a rewrite and conflicts with the existing drawer/hook architecture.
- **`defaultQueryOptions.initialData`**: Same staleness problem as prop initialData. Rejected.

## Consequences

- Every new list page must follow this pattern. No new `initialData` props.
- Existing pages using `initialData` must be migrated. See the migration checklist below.
- Every feature that adds a list page must also add a `query-keys.ts` constants file and a `useEntityList` hook.
- The `initialData` prop must be removed from list view components as they are migrated — do not leave dead props.

## Migration Checklist

Pages still using `initialData` that must be migrated:

- [ ] `finances/quotes/page.tsx`
- [ ] `finances/quotes/[id]/page.tsx`
- [ ] `finances/recipes/page.tsx`
- [ ] `finances/recipes/[id]/page.tsx`
- [ ] `finances/transactions/page.tsx`
- [ ] `finances/transactions/[id]/page.tsx`
- [ ] `finances/invoices/[id]/page.tsx`
- [ ] `inventory/products/page.tsx`
- [ ] `inventory/products/[id]/page.tsx`
- [ ] `inventory/vendors/page.tsx`
- [ ] `inventory/vendors/[id]/page.tsx`
- [ ] `inventory/price-list/page.tsx`
- [ ] `inventory/price-list/[id]/page.tsx`
- [ ] `staff/employees/page.tsx`
- [ ] `staff/employees/[id]/page.tsx`
- [ ] `admin/tenants/page.tsx`
- [ ] `admin/users/page.tsx`
- [ ] `tools/tasks/page.tsx`
