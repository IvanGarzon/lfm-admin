---
description: Frontend Replication Blueprint - architectural patterns extracted from Invoices module
---

# Frontend Replication Blueprint

This document defines the authoritative frontend architectural patterns for feature modules in this codebase. All new modules **MUST** follow these patterns exactly. Extracted from the **Invoices** module.

---

## 1. Data Fetching Strategy

### Server-Side Data Fetching (Initial Load)

```typescript
// src/app/(protected)/{domain}/{module}/page.tsx
import { SearchParams } from 'nuqs/server';
import { Shell } from '@/components/shared/shell';
import { constructMetadata } from '@/lib/utils';
import { get{Entities} } from '@/actions/{module}';
import { {Entities}View } from '@/features/{domain}/{module}/components/{module}-view';

export const metadata = constructMetadata({
  title: '{Entities} – lfm dashboard',
  description: 'Manage your {entities}.',
});

export default async function {Entities}Page({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const searchParamsResolved = await searchParams;
  const result = await get{Entities}(searchParamsResolved);

  if (!result.success) {
    throw new Error(result.error);
  }

  return (
    <Shell scrollable>
      <{Entities}View initialData={result.data} searchParams={searchParamsResolved} />
    </Shell>
  );
}
```

### Client-Side Data Fetching (React Query)

```typescript
// src/features/{domain}/{module}/hooks/use-{module}-queries.ts
'use client';

import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { toast } from 'sonner';
import { get{Entities}, get{Entity}ById, create{Entity} } from '@/actions/{module}';
import type { {Entity}Filters } from '@/features/{domain}/{module}/types';

// Query key factory pattern
export const {ENTITY}_KEYS = {
  all: ['{entities}'] as const,
  lists: () => [...{ENTITY}_KEYS.all, 'list'] as const,
  list: (filters: {Entity}Filters) => [...{ENTITY}_KEYS.lists(), { filters }] as const,
  details: () => [...{ENTITY}_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...{ENTITY}_KEYS.details(), id] as const,
  items: (id: string) => [...{ENTITY}_KEYS.detail(id), 'items'] as const,
  statistics: () => [...{ENTITY}_KEYS.all, 'statistics'] as const,
};
```

### Query Hook Pattern

```typescript
export function use{Entity}(id: string | undefined) {
  return useQuery({
    queryKey: {ENTITY}_KEYS.detail(id ?? ''),
    queryFn: async () => {
      if (!id) {
        throw new Error('{Entity} ID is required');
      }
      const result = await get{Entity}ById(id);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    enabled: Boolean(id),  // Conditional fetching
    staleTime: 30 * 1000,  // 30 seconds
  });
}
```

### Statistics Query Pattern (Stable Query Keys)

```typescript
export function use{Entity}Statistics(
  dateFilter?: { startDate?: Date; endDate?: Date },
  options?: { enabled?: boolean },
) {
  // Normalize date filter to ISO date strings for stable query keys
  // This prevents cache misses when component remounts with logically identical dates
  const normalizedDateFilter = dateFilter
    ? {
        startDate: dateFilter.startDate ? formatDateNormalizer(dateFilter.startDate) : null,
        endDate: dateFilter.endDate ? formatDateNormalizer(dateFilter.endDate) : null,
      }
    : undefined;

  return useQuery({
    queryKey: [...{ENTITY}_KEYS.statistics(), normalizedDateFilter],
    queryFn: async () => {
      const result = await get{Entity}Statistics(dateFilter);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    staleTime: 60 * 1000, // 1 minute
    placeholderData: keepPreviousData,  // Prevents skeleton flash on refetch
    enabled: options?.enabled,
  });
}
```

---

## 2. Query/Mutation Structure

### Mutation Pattern with Optimistic Updates

```typescript
export function useUpdate{Entity}() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Update{Entity}Input) => {
      const result = await update{Entity}(data);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },

    // Optimistic update
    onMutate: async (newData) => {
      // 1. Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: {ENTITY}_KEYS.detail(newData.id) });
      await queryClient.cancelQueries({ queryKey: {ENTITY}_KEYS.lists() });

      // 2. Snapshot the previous value
      const previousEntity = queryClient.getQueryData({ENTITY}_KEYS.detail(newData.id));

      // 3. Optimistically update cache
      queryClient.setQueryData(
        {ENTITY}_KEYS.detail(newData.id),
        (old: {Entity}WithDetails | undefined) => {
          if (!old) return old;
          return { ...old, ...newData };
        },
      );

      // 4. Return context for rollback
      return { previousEntity };
    },

    // Rollback on error
    onError: (err, newData, context) => {
      if (context?.previousEntity) {
        queryClient.setQueryData({ENTITY}_KEYS.detail(newData.id), context.previousEntity);
      }
      toast.error(err.message || 'Failed to update {entity}');
    },

    // Always refetch after error or success
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({ queryKey: {ENTITY}_KEYS.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: {ENTITY}_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: {ENTITY}_KEYS.statistics() });
    },

    onSuccess: () => {
      toast.success('{Entity} updated successfully');
    },
  });
}
```

### Simple Mutation Pattern (No Optimistic Updates)

```typescript
export function useCreate{Entity}() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Create{Entity}Input) => {
      const result = await create{Entity}(data);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: {ENTITY}_KEYS.lists() });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: {ENTITY}_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: {ENTITY}_KEYS.statistics() });
      toast.success(`{Entity} ${data.{entity}Number} created successfully`);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create {entity}');
    },
  });
}
```

### Prefetch Pattern (for Hover Optimization)

```typescript
export function usePrefetch{Entity}() {
  const queryClient = useQueryClient();

  return (entityId: string) => {
    queryClient.prefetchQuery({
      queryKey: [...{ENTITY}_KEYS.detail(entityId), 'basic'],
      queryFn: async () => {
        const result = await get{Entity}BasicById(entityId);
        if (!result.success) throw new Error(result.error);
        return result.data;
      },
      staleTime: 30 * 1000,
    });
  };
}
```

---

## 3. Form Handling Pattern

### Form Setup with React Hook Form + Zod

```typescript
// src/features/{domain}/{module}/components/{entity}-form.tsx
'use client';

import { useCallback, useEffect, useMemo } from 'react';
import { Controller, useForm, useFieldArray, type Resolver, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { Form } from '@/components/ui/form';
import { Field, FieldContent, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Create{Entity}Schema, Update{Entity}Schema, type Create{Entity}Input } from '@/schemas/{module}';
import { useUnsavedChanges } from '@/hooks/use-unsaved-changes';

const defaultFormState: Create{Entity}Input = {
  // Default values here
};

export function {Entity}Form({
  entity,
  onCreate,
  onUpdate,
  isCreating = false,
  isUpdating = false,
  onDirtyStateChange,
}: {
  entity?: {Entity}Basic | null;
  onCreate?: (data: Create{Entity}Input) => void;
  onUpdate?: (data: Update{Entity}Input) => void;
  isCreating?: boolean;
  isUpdating?: boolean;
  onDirtyStateChange?: (isDirty: boolean) => void;
}) {
  const mode = entity ? 'update' : 'create';

  // Dynamic resolver based on mode
  const createResolver: Resolver<{Entity}FormInput> = (values, context, options) => {
    const schema = mode === 'create' ? Create{Entity}Schema : Update{Entity}Schema;
    return zodResolver(schema)(values, context, options);
  };

  const form = useForm<{Entity}FormInput>({
    mode: 'onChange',
    resolver: createResolver,
    defaultValues: mode === 'create' ? defaultFormState : mapEntityToFormValues(entity),
  });

  // Reset form when entity changes
  useEffect(() => {
    if (mode === 'update' && entity) {
      form.reset(mapEntityToFormValues(entity));
    }
  }, [entity, mode]);

  // Track dirty state for parent
  useEffect(() => {
    if (onDirtyStateChange) {
      onDirtyStateChange(form.formState.isDirty);
    }
  }, [form.formState.isDirty, onDirtyStateChange]);

  // Warn user before leaving page with unsaved changes
  useUnsavedChanges(form.formState.isDirty);

  const onSubmit: SubmitHandler<{Entity}FormInput> = useCallback(
    (data) => {
      if (mode === 'create') {
        onCreate?.(data);
      } else {
        onUpdate?.({ ...data, id: entity?.id ?? '' });
      }
    },
    [mode, onCreate, onUpdate, entity?.id],
  );

  return (
    <Form {...form}>
      <form id="form-rhf-{entity}" onSubmit={form.handleSubmit(onSubmit)}>
        {/* Form fields using Controller pattern */}
      </form>
    </Form>
  );
}
```

### Field Pattern (Controller with FieldError)

```typescript
<FieldGroup>
  <Controller
    name="customerId"
    control={form.control}
    render={({ field, fieldState }) => (
      <Field data-invalid={fieldState.invalid}>
        <FieldContent>
          <FieldLabel htmlFor="form-rhf-customer">Customer</FieldLabel>
        </FieldContent>
        <CustomerSelect
          value={field.value}
          onValueChange={field.onChange}
          disabled={isLocked}
        />
        {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
      </Field>
    )}
  />
</FieldGroup>
```

### Field Array Pattern (for Line Items)

```typescript
const itemsFieldArray = useFieldArray({
  control: form.control,
  name: 'items',
});

// Usage
{itemsFieldArray.fields.map((field, index) => (
  <ItemRow
    key={field.id}
    index={index}
    onRemove={() => itemsFieldArray.remove(index)}
  />
))}

<Button type="button" onClick={() => itemsFieldArray.append(defaultItem)}>
  Add Item
</Button>
```

---

## 4. Validation Integration

### Schema Location

```
src/schemas/{module}.ts
```

### Form + Zod Integration

```typescript
import { zodResolver } from '@hookform/resolvers/zod';
import { Create{Entity}Schema } from '@/schemas/{module}';

const form = useForm({
  resolver: zodResolver(Create{Entity}Schema),
  mode: 'onChange', // Validate on change for real-time feedback
});
```

### Error Display

```typescript
// Using FieldError component
{fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}

// Using FormMessage (FormField pattern)
<FormMessage />
```

---

## 5. Toast Pattern

### Import

```typescript
import { toast } from 'sonner';
```

### Usage Patterns

```typescript
// Success
toast.success('Invoice created successfully');
toast.success(`Invoice ${data.invoiceNumber} created successfully`);

// Error
toast.error(error.message || 'Failed to create invoice');

// Warning with action
toast.warning('You have unsaved changes', {
  description: 'Please save your changes before downloading.',
  duration: 5000,
  action: {
    label: 'Save Now',
    onClick: () => form.requestSubmit(),
  },
});

// Info
toast.info('Processing...', { duration: 2000 });
```

### Mutation Hook Toast Integration

```typescript
useMutation({
  onSuccess: () => toast.success('Created successfully'),
  onError: (error: Error) => toast.error(error.message || 'Operation failed'),
});
```

---

## 6. Loading/Error Handling

### Query Loading States

```typescript
const { data, isLoading, error, isError } = use{Entity}(id);

// In component
{isLoading ? <{Entity}DrawerSkeleton /> : null}

{isError ? (
  <Box className="p-6 text-destructive">
    <p>Could not load details: {error?.message}</p>
  </Box>
) : null}

{data && !isLoading && !isError ? (
  <{Entity}Content data={data} />
) : null}
```

### Mutation Loading States

```typescript
const createMutation = useCreate{Entity}();

<Button
  type="submit"
  disabled={createMutation.isPending}
>
  {createMutation.isPending ? 'Creating...' : 'Create'}
</Button>
```

### Form-Level Loading Indicator

```typescript
{isCreating || isUpdating ? (
  <Box className="px-6 py-3 bg-primary/10 border-b flex items-center justify-center gap-2">
    <Loader2 className="h-4 w-4 animate-spin" />
    <span className="text-sm font-medium">
      {isCreating ? 'Creating...' : 'Updating...'}
    </span>
  </Box>
) : null}
```

### Skeleton Component Pattern

```typescript
// src/features/{domain}/{module}/components/{entity}-drawer-skeleton.tsx
export function {Entity}DrawerSkeleton() {
  return (
    <Box className="p-6 space-y-4">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-64 w-full" />
    </Box>
  );
}
```

---

## 7. Suspense Usage

### Dynamic Import Pattern

```typescript
import dynamic from 'next/dynamic';

const {Entity}Drawer = dynamic(
  () => import('@/features/{domain}/{module}/components/{entity}-drawer').then(
    (mod) => mod.{Entity}Drawer,
  ),
  {
    ssr: false,
    loading: () => null, // Or skeleton
  },
);
```

### Lazy Loading Heavy Components

```typescript
const {Entity}Preview = dynamic(
  () => import('@/features/{domain}/{module}/components/{entity}-preview').then(
    (mod) => mod.{Entity}Preview,
  ),
  {
    ssr: false,
    loading: () => (
      <Box className="flex items-center justify-center h-full">
        <p className="text-sm text-muted-foreground">Loading preview...</p>
      </Box>
    ),
  },
);
```

---

## 8. Table Abstraction Pattern

### Data Table Hook

```typescript
// src/hooks/use-data-table.ts
import { useDataTable } from '@/hooks/use-data-table';

const { table } = useDataTable({
  data: data.items,
  columns,
  pageCount: Math.ceil(data.pagination.totalItems / perPage),
  shallow: false, // Update URL on changes
  debounceMs: 500, // Debounce filter changes
});
```

### Column Definition Pattern

```typescript
// src/features/{domain}/{module}/components/{entity}-columns.tsx
import { ColumnDef } from '@tanstack/react-table';
import { DataTableColumnHeader } from '@/components/shared/tableV3/data-table-column-header';

export const create{Entity}Columns = (
  onDelete: (id: string) => void,
  onEdit: (id: string) => void,
): ColumnDef<{Entity}ListItem>[] => [
  {
    id: 'select',
    header: ({ table }) => <SelectAllCheckbox table={table} />,
    cell: ({ row }) => <RowCheckbox row={row} />,
    enableSorting: false,
    enableHiding: false,
  },
  {
    id: 'search',  // ID matches filter param name
    accessorKey: '{entity}Number',
    header: ({ column }) => <DataTableColumnHeader column={column} title="{Entity} #" />,
    cell: ({ row }) => <{Entity}Link entity={row.original} />,
    enableSorting: true,
    enableColumnFilter: true,
    meta: {
      label: '{Entity} #',
      placeholder: 'Search by {entity} number...',
      variant: 'text',
    },
  },
  {
    id: 'status',
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => <StatusBadge status={row.getValue('status')} />,
    filterFn: (row, id, value) => value.includes(row.getValue(id)),
    enableColumnFilter: true,
    meta: {
      label: 'Status',
      variant: 'multiSelect',
      options: StatusOptions,
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => <{Entity}Actions entity={row.original} onDelete={onDelete} onEdit={onEdit} />,
    enableHiding: false,
  },
];
```

### Table Component Pattern

```typescript
// src/features/{domain}/{module}/components/{entity}-table.tsx
import { Table } from '@tanstack/react-table';
import { DataTable } from '@/components/shared/tableV3/data-table';
import { DataTableToolbar } from '@/components/shared/tableV3/data-table-toolbar';

export function {Entity}Table<TData>({ table, items, totalItems }: Props<TData>) {
  const prefetch = usePrefetch{Entity}();

  const handleRowHover = (entity: TData) => {
    prefetch((entity as {Entity}ListItem).id);
  };

  return (
    <Card className="flex w-full flex-col space-y-4 p-4 overflow-hidden min-w-0">
      <DataTableToolbar table={table} />
      {items.length ? (
        <DataTable table={table} totalItems={totalItems} onRowHover={handleRowHover} />
      ) : (
        <Box className="text-center py-12 text-muted-foreground">
          No {entities} found. Try adjusting your filters.
        </Box>
      )}
    </Card>
  );
}
```

---

## 9. Modal vs Page Editing Approach

### Pattern: Drawer-Based Detail View

The Invoices module uses a **Drawer pattern** for both creating and editing, with URL-based navigation.

### Layout with Modal/Intercepting Routes

```typescript
// src/app/(protected)/{domain}/{module}/layout.tsx
import { {Entity}ActionProvider } from '@/features/{domain}/{module}/context/{entity}-action-context';

export default function {Entities}Layout({
  children,
  modal,  // Intercepting route slot
}: {
  children: React.ReactNode;
  modal: React.ReactNode;
}) {
  return (
    <{Entity}ActionProvider>
      {children}
      {modal}
    </{Entity}ActionProvider>
  );
}
```

### Detail Page (URL-Based)

```typescript
// src/app/(protected)/{domain}/{module}/[id]/page.tsx
import dynamic from 'next/dynamic';

const {Entity}Drawer = dynamic(
  () => import('@/features/{domain}/{module}/components/{entity}-drawer').then(
    (mod) => mod.{Entity}Drawer,
  ),
  { loading: () => null },
);

export default async function {Entity}Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const { id } = await params;
  const searchParamsResolved = await searchParams;
  const result = await get{Entities}(searchParamsResolved);

  if (!result.success) {
    throw new Error(result.error);
  }

  return (
    <Shell scrollable>
      <{Entities}View initialData={result.data} searchParams={searchParamsResolved} />
      {id ? <{Entity}Drawer key={id} id={id} open={true} /> : null}
    </Shell>
  );
}
```

### Drawer Navigation Pattern

```typescript
// In drawer component
const router = useRouter();
const pathname = usePathname();
const queryString = use{Entity}QueryString(searchParams, defaults);

const isOpen = id ? (pathname?.includes(`/{module}/${id}`) ?? false) : (open ?? false);

const handleOpenChange = useCallback(
  (openState: boolean) => {
    if (!openState) {
      if (id) {
        const basePath = '/{domain}/{module}';
        const targetPath = queryString ? `${basePath}?${queryString}` : basePath;
        router.push(targetPath);
      } else {
        onClose?.();
      }
    }
  },
  [id, onClose, router, queryString],
);
```

---

## 10. Action Context Pattern

### Purpose

Centralize dialog/modal state management for actions that can be triggered from multiple places (table rows, drawer, bulk actions).

### Context Definition

```typescript
// src/features/{domain}/{module}/context/{entity}-action-context.tsx
'use client';

import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { useDelete{Entity}, useRecordPayment } from '../hooks/use-{module}-queries';
import { Delete{Entity}Dialog } from '../components/delete-{entity}-dialog';
import { RecordPaymentDialog } from '../components/record-payment-dialog';

type ModalType = 'DELETE' | 'RECORD_PAYMENT' | 'CANCEL';

interface ModalState {
  type: ModalType;
  id: string;
  entityNumber?: string;
  entity?: {Entity}WithDetails;
  onSuccess?: () => void;
}

interface {Entity}ActionContextType {
  openDelete: (id: string, entityNumber?: string, onSuccess?: () => void) => void;
  openRecordPayment: (id: string, entityNumber: string, onSuccess?: () => void) => void;
  close: () => void;
}

const {Entity}ActionContext = createContext<{Entity}ActionContextType | undefined>(undefined);

export function {Entity}ActionProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<ModalState | null>(null);

  const deleteMutation = useDelete{Entity}();

  const openDelete = useCallback((id: string, entityNumber?: string, onSuccess?: () => void) => {
    setState({ type: 'DELETE', id, entityNumber, onSuccess });
  }, []);

  const close = useCallback(() => {
    setState(null);
  }, []);

  const handleConfirmDelete = useCallback(() => {
    if (state?.type === 'DELETE' && state.id) {
      deleteMutation.mutate(state.id, {
        onSuccess: () => {
          close();
          state.onSuccess?.();
        },
      });
    }
  }, [state, deleteMutation, close]);

  const value = useMemo(
    () => ({ openDelete, openRecordPayment, close }),
    [openDelete, openRecordPayment, close],
  );

  return (
    <{Entity}ActionContext.Provider value={value}>
      {children}

      <Delete{Entity}Dialog
        open={state?.type === 'DELETE'}
        onOpenChange={(open) => !open && close()}
        onConfirm={handleConfirmDelete}
        entityNumber={state?.entityNumber}
        isPending={deleteMutation.isPending}
      />

      {/* Other dialogs... */}
    </{Entity}ActionContext.Provider>
  );
}

export function use{Entity}Actions() {
  const context = useContext({Entity}ActionContext);
  if (context === undefined) {
    throw new Error('use{Entity}Actions must be used within a {Entity}ActionProvider');
  }
  return context;
}
```

### Usage

```typescript
// In any component within the provider
const { openDelete, openRecordPayment } = use{Entity}Actions();

<Button onClick={() => openDelete(entity.id, entity.entityNumber)}>
  Delete
</Button>
```

---

## 11. URL State Synchronization (nuqs)

### Filter Search Params Cache

```typescript
// src/filters/{module}/{module}-filters.ts
import { {Entity}StatusSchema } from '@/zod/schemas/enums/{Entity}Status.schema';
import { getSortingStateParser } from '@/lib/parsers';
import { SORTABLE_{ENTITY}_COLUMNS } from '@/features/{domain}/{module}/constants/sortable-columns';
import {
  createSearchParamsCache,
  parseAsInteger,
  parseAsString,
  parseAsStringEnum,
  parseAsArrayOf,
} from 'nuqs/server';

const sortableColumnIds = new Set(SORTABLE_{ENTITY}_COLUMNS);

export const searchParams = {
  search: parseAsString.withDefault(''),
  page: parseAsInteger.withDefault(1),
  perPage: parseAsInteger.withDefault(20),
  status: parseAsArrayOf(
    parseAsStringEnum<{Entity}Status>({Entity}StatusSchema.options)
  ).withDefault([]),
  sort: getSortingStateParser(sortableColumnIds).withDefault([]),
};

export const searchParamsCache = createSearchParamsCache(searchParams);

export const {entity}SearchParamsDefaults = {
  search: '',
  page: 1,
  perPage: 20,
  status: [],
  sort: [],
};
```

### Query String Preservation Hook

```typescript
// src/features/{domain}/{module}/hooks/use-{entity}-query-string.ts
'use client';

import { useQueryStates } from 'nuqs';

export function use{Entity}QueryString<T extends Record<string, unknown>>(
  searchParams: { [K in keyof T]: NuqsParser<T[K]> },
  defaults: Partial<T>,
): string {
  const [currentParams] = useQueryStates(searchParams);
  const queryParts: string[] = [];

  for (const key of Object.keys(searchParams) as (keyof T)[]) {
    const value = currentParams[key];
    const defaultValue = defaults[key];
    const parser = searchParams[key];

    if (value === null || value === undefined) continue;
    if (isDefaultValue(value, defaultValue)) continue;

    const serialized = parser.serialize(value);
    if (serialized) {
      queryParts.push(`${String(key)}=${serialized}`);
    }
  }

  return queryParts.join('&');
}
```

---

## 12. React Query Provider Setup

```typescript
// src/providers/ReactQueryProvider.tsx
'use client';

import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';

export const ReactQueryProvider = ({ children }: { children: React.ReactNode }) => {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 5, // 5 minutes
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={true} />
    </QueryClientProvider>
  );
};
```

---

## Folder Structure Summary

```
src/
├── app/(protected)/{domain}/{module}/
│   ├── layout.tsx              # ActionProvider wrapper
│   ├── page.tsx                # SSR list page
│   ├── [id]/page.tsx           # SSR detail page (with drawer)
│   └── @modal/                 # Optional: intercepting routes
│
├── features/{domain}/{module}/
│   ├── components/
│   │   ├── {entity}-view.tsx         # Main view orchestrator
│   │   ├── {entity}-list.tsx         # List with table
│   │   ├── {entity}-table.tsx        # Table wrapper
│   │   ├── {entity}-columns.tsx      # Column definitions
│   │   ├── {entity}-drawer.tsx       # Create/Edit drawer
│   │   ├── {entity}-form.tsx         # Form component
│   │   ├── {entity}-drawer-skeleton.tsx
│   │   ├── {entity}-status-badge.tsx
│   │   ├── {entity}-actions.tsx      # Row actions dropdown
│   │   ├── delete-{entity}-dialog.tsx
│   │   └── bulk-actions-bar.tsx
│   ├── hooks/
│   │   ├── use-{module}-queries.ts   # React Query hooks
│   │   └── use-{entity}-query-string.ts
│   ├── context/
│   │   └── {entity}-action-context.tsx
│   ├── constants/
│   │   └── sortable-columns.ts
│   ├── utils/
│   │   └── {entity}-helpers.ts
│   └── types.ts
│
├── filters/{module}/
│   └── {module}-filters.ts           # nuqs search params
│
├── schemas/
│   └── {module}.ts                   # Zod schemas
│
├── hooks/
│   ├── use-data-table.ts             # Shared table hook
│   └── use-unsaved-changes.ts        # Form protection
│
└── components/shared/tableV3/        # Shared table components
    ├── data-table.tsx
    ├── data-table-toolbar.tsx
    ├── data-table-pagination.tsx
    └── data-table-column-header.tsx
```

---

## Checklist for New Frontend Modules

- [ ] `src/app/(protected)/{domain}/{module}/page.tsx` - SSR list page
- [ ] `src/app/(protected)/{domain}/{module}/[id]/page.tsx` - Detail page
- [ ] `src/app/(protected)/{domain}/{module}/layout.tsx` - ActionProvider
- [ ] `src/features/{domain}/{module}/components/{entity}-view.tsx`
- [ ] `src/features/{domain}/{module}/components/{entity}-list.tsx`
- [ ] `src/features/{domain}/{module}/components/{entity}-table.tsx`
- [ ] `src/features/{domain}/{module}/components/{entity}-columns.tsx`
- [ ] `src/features/{domain}/{module}/components/{entity}-drawer.tsx`
- [ ] `src/features/{domain}/{module}/components/{entity}-form.tsx`
- [ ] `src/features/{domain}/{module}/hooks/use-{module}-queries.ts`
- [ ] `src/features/{domain}/{module}/context/{entity}-action-context.tsx`
- [ ] `src/features/{domain}/{module}/types.ts`
- [ ] `src/filters/{module}/{module}-filters.ts`

---

## Anti-Patterns (DO NOT DO)

1. ❌ Fetching data in components without React Query
2. ❌ Mutating without invalidating related queries
3. ❌ Using `any` in mutation/query return types
4. ❌ Hard-coding toast messages without error fallback
5. ❌ Forgetting `enabled: Boolean(id)` for conditional queries
6. ❌ Not using `keepPreviousData` for statistics queries
7. ❌ Inline form validation instead of Zod schemas
8. ❌ Not wrapping feature routes with ActionProvider
9. ❌ Not debouncing filter changes in tables
10. ❌ Forgetting `useUnsavedChanges` for forms
