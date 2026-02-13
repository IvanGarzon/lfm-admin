---
description: Module Replication System Specification - complete rules for generating new modules
---

# Module Replication System Specification

This specification defines the **authoritative rules** for creating new feature modules in this codebase. All generated modules **MUST** comply with every rule defined herein. Non-compliance is a build failure.

**Source of Truth**: Extracted from the Invoices module implementation.

---

## Table of Contents

1. [Structural Rules](#1-structural-rules)
2. [Naming Rules](#2-naming-rules)
3. [Required Layers](#3-required-layers)
4. [Required Utilities](#4-required-utilities)
5. [Required Patterns](#5-required-patterns)
6. [Constraints](#6-constraints)
7. [File Templates](#7-file-templates)
8. [Generation Checklist](#8-generation-checklist)

---

## 1. Structural Rules

### 1.1 Directory Structure

Every module MUST create files in the following locations. Placeholders:

- `{module}` = plural lowercase (e.g., `invoices`, `quotes`, `customers`)
- `{entity}` = singular lowercase (e.g., `invoice`, `quote`, `customer`)
- `{Entity}` = singular PascalCase (e.g., `Invoice`, `Quote`, `Customer`)
- `{domain}` = feature domain (e.g., `finances`, `crm`)

```
src/
├── actions/{module}/
│   ├── mutations.ts              # REQUIRED
│   ├── queries.ts                # REQUIRED
│   └── index.ts                  # REQUIRED: re-exports
│
├── repositories/
│   ├── {entity}-repository.ts    # REQUIRED
│   └── {entity}-repository.spec.ts # REQUIRED
│
├── schemas/
│   └── {module}.ts               # REQUIRED
│
├── filters/{module}/
│   └── {module}-filters.ts       # REQUIRED
│
├── features/{domain}/{module}/
│   ├── types.ts                  # REQUIRED
│   ├── components/               # REQUIRED
│   │   ├── {entity}-view.tsx
│   │   ├── {entity}-list.tsx
│   │   ├── {entity}-table.tsx
│   │   ├── {entity}-columns.tsx
│   │   ├── {entity}-drawer.tsx
│   │   ├── {entity}-form.tsx
│   │   ├── {entity}-drawer-skeleton.tsx
│   │   ├── {entity}-status-badge.tsx
│   │   ├── {entity}-actions.tsx
│   │   └── delete-{entity}-dialog.tsx
│   ├── hooks/
│   │   ├── use-{module}-queries.ts    # REQUIRED
│   │   └── use-{entity}-query-string.ts
│   ├── context/
│   │   └── {entity}-action-context.tsx # REQUIRED
│   ├── constants/
│   │   └── sortable-columns.ts
│   └── utils/
│       └── {entity}-helpers.ts
│
├── app/(protected)/{domain}/{module}/
│   ├── layout.tsx                # REQUIRED: wraps ActionProvider
│   ├── page.tsx                  # REQUIRED: SSR list
│   └── [id]/
│       └── page.tsx              # REQUIRED: SSR detail
│
└── lib/permissions.ts            # UPDATE: add new permissions
```

### 1.2 File Co-Location Rules

| File Type        | Location                                     | Rationale                |
| ---------------- | -------------------------------------------- | ------------------------ |
| Server Actions   | `src/actions/{module}/`                      | Collocated by feature    |
| Repositories     | `src/repositories/`                          | Shared data access layer |
| Zod Schemas      | `src/schemas/`                               | Shared validation        |
| URL Filters      | `src/filters/{module}/`                      | nuqs configuration       |
| React Components | `src/features/{domain}/{module}/components/` | Feature isolation        |
| React Hooks      | `src/features/{domain}/{module}/hooks/`      | Feature isolation        |
| Types            | `src/features/{domain}/{module}/types.ts`    | Feature isolation        |
| Pages            | `src/app/(protected)/{domain}/{module}/`     | Next.js App Router       |

---

## 2. Naming Rules

### 2.1 File Naming

| Type            | Pattern                       | Example                             |
| --------------- | ----------------------------- | ----------------------------------- |
| Actions         | `mutations.ts`, `queries.ts`  | `src/actions/invoices/mutations.ts` |
| Repository      | `{entity}-repository.ts`      | `invoice-repository.ts`             |
| Schema          | `{module}.ts`                 | `invoices.ts`                       |
| Filter          | `{module}-filters.ts`         | `invoices-filters.ts`               |
| View Component  | `{entity}-view.tsx`           | `invoice-view.tsx`                  |
| List Component  | `{entity}-list.tsx`           | `invoice-list.tsx`                  |
| Table Component | `{entity}-table.tsx`          | `invoice-table.tsx`                 |
| Columns         | `{entity}-columns.tsx`        | `invoice-columns.tsx`               |
| Drawer          | `{entity}-drawer.tsx`         | `invoice-drawer.tsx`                |
| Form            | `{entity}-form.tsx`           | `invoice-form.tsx`                  |
| Query Hook      | `use-{module}-queries.ts`     | `use-invoice-queries.ts`            |
| Context         | `{entity}-action-context.tsx` | `invoice-action-context.tsx`        |
| Types           | `types.ts`                    | `types.ts`                          |

### 2.2 Export Naming

| Type              | Pattern                                   | Example                        |
| ----------------- | ----------------------------------------- | ------------------------------ |
| Repository Class  | `{Entity}Repository`                      | `InvoiceRepository`            |
| Zod Schema        | `{Entity}Schema`, `Create{Entity}Schema`  | `CreateInvoiceSchema`          |
| Type              | `{Entity}WithDetails`, `{Entity}ListItem` | `InvoiceWithDetails`           |
| Query Key Factory | `{ENTITY}_KEYS`                           | `INVOICE_KEYS`                 |
| Query Hook        | `use{Entity}`, `use{Entities}`            | `useInvoice`, `useInvoices`    |
| Mutation Hook     | `useCreate{Entity}`, `useUpdate{Entity}`  | `useCreateInvoice`             |
| Context Hook      | `use{Entity}Actions`                      | `useInvoiceActions`            |
| Provider          | `{Entity}ActionProvider`                  | `InvoiceActionProvider`        |
| Server Action     | `create{Entity}`, `get{Entities}`         | `createInvoice`, `getInvoices` |

### 2.3 Variable Naming

| Type                | Pattern                            | Example            |
| ------------------- | ---------------------------------- | ------------------ |
| Repository instance | `{entity}Repo`                     | `invoiceRepo`      |
| Mutation result     | `create{Entity}`, `update{Entity}` | `createInvoice`    |
| Filter object       | `{entity}Filters`                  | `invoiceFilters`   |
| Prisma where clause | `whereClause`                      | `whereClause`      |
| Form default state  | `defaultFormState`                 | `defaultFormState` |

---

## 3. Required Layers

### 3.1 Backend Layers

```
┌─────────────────────────────────────────────────────────────┐
│                      SERVER ACTION                          │
│  • Authentication (auth())                                  │
│  • Authorization (requirePermission())                      │
│  • Input Validation (Zod schema.parse())                    │
│  • Orchestration (call repository)                          │
│  • Cache Invalidation (revalidatePath)                      │
│  • Error Handling (handleActionError)                       │
│  • Return ActionResult<T>                                   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      REPOSITORY                             │
│  • All Prisma operations                                    │
│  • Transactions ($transaction)                              │
│  • Business logic                                           │
│  • Number generation                                        │
│  • Status transitions                                       │
│  • Soft delete enforcement (deletedAt: null)                │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      PRISMA CLIENT                          │
│  • Database access                                          │
│  • Type-safe queries                                        │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 Frontend Layers

```
┌─────────────────────────────────────────────────────────────┐
│                      PAGE (Server Component)                │
│  • SSR data fetching                                        │
│  • Pass initialData to view                                 │
│  • Metadata generation                                      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      VIEW (Client Component)                │
│  • State management                                         │
│  • Tab/layout orchestration                                 │
│  • Modal state (showCreateModal)                            │
└─────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│      LIST       │  │     DRAWER      │  │   ANALYTICS     │
│  • Table        │  │  • Form         │  │  • Charts       │
│  • Pagination   │  │  • Tabs         │  │  • Stats        │
│  • Actions      │  │  • Preview      │  │  • Trends       │
└─────────────────┘  └─────────────────┘  └─────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      QUERY HOOKS                            │
│  • useQuery for reads                                       │
│  • useMutation for writes                                   │
│  • Query key management                                     │
│  • Cache invalidation                                       │
│  • Optimistic updates                                       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      SERVER ACTIONS                         │
│  (Called via React Query)                                   │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. Required Utilities

### 4.1 Backend Utilities (MUST USE)

| Utility                 | Import Path            | Purpose                     |
| ----------------------- | ---------------------- | --------------------------- |
| `prisma`                | `@/lib/prisma`         | Database client singleton   |
| `auth`                  | `@/auth`               | Session authentication      |
| `requirePermission`     | `@/lib/permissions`    | Authorization check         |
| `handleActionError`     | `@/lib/error-handler`  | Standardized error handling |
| `logger`                | `@/lib/logger`         | Logging                     |
| `getPaginationMetadata` | `@/lib/utils`          | Pagination calculation      |
| `withDatabaseRetry`     | `@/lib/retry`          | Retry transient failures    |
| `BaseRepository`        | `@/lib/baseRepository` | Repository base class       |
| `commonValidators`      | `@/lib/validation`     | Shared Zod validators       |
| `VALIDATION_LIMITS`     | `@/lib/validation`     | Validation constants        |

### 4.2 Frontend Utilities (MUST USE)

| Utility                   | Import Path                                      | Purpose                |
| ------------------------- | ------------------------------------------------ | ---------------------- |
| `useQuery`, `useMutation` | `@tanstack/react-query`                          | Data fetching          |
| `useQueryClient`          | `@tanstack/react-query`                          | Cache management       |
| `keepPreviousData`        | `@tanstack/react-query`                          | Prevent skeleton flash |
| `toast`                   | `sonner`                                         | Notifications          |
| `useForm`, `Controller`   | `react-hook-form`                                | Form state             |
| `useFieldArray`           | `react-hook-form`                                | Dynamic arrays         |
| `zodResolver`             | `@hookform/resolvers/zod`                        | Form validation        |
| `useDataTable`            | `@/hooks/use-data-table`                         | Table state            |
| `useUnsavedChanges`       | `@/hooks/use-unsaved-changes`                    | Form protection        |
| `useQueryStates`          | `nuqs`                                           | URL state              |
| `createSearchParamsCache` | `nuqs/server`                                    | SSR URL parsing        |
| `Form`                    | `@/components/ui/form`                           | FormProvider wrapper   |
| `Field`, `FieldError`     | `@/components/ui/field`                          | Field components       |
| `DataTable`               | `@/components/shared/tableV3/data-table`         | Table component        |
| `DataTableToolbar`        | `@/components/shared/tableV3/data-table-toolbar` | Toolbar                |

### 4.3 Shared Schema Utilities

| Utility                 | Import Path        | Purpose            |
| ----------------------- | ------------------ | ------------------ |
| `baseFiltersSchema`     | `@/schemas/common` | Base filter schema |
| `createEnumArrayFilter` | `@/schemas/common` | Enum array filter  |
| `sortingSchema`         | `@/schemas/common` | Sorting schema     |

---

## 5. Required Patterns

### 5.1 Backend Patterns

#### 5.1.1 Action Pattern (MANDATORY)

```typescript
// src/actions/{module}/mutations.ts
'use server';

import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';
import { handleActionError } from '@/lib/error-handler';
import { requirePermission } from '@/lib/permissions';
import { Create{Entity}Schema } from '@/schemas/{module}';
import type { ActionResult } from '@/types/actions';

export async function create{Entity}(
  data: Create{Entity}Input,
): Promise<ActionResult<{ id: string }>> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    requirePermission(session.user, 'canManage{Entities}');
    const validatedData = Create{Entity}Schema.parse(data);
    const result = await {entity}Repo.create{Entity}(validatedData, session.user.id);
    revalidatePath('/{domain}/{module}');
    return { success: true, data: { id: result.id } };
  } catch (error) {
    return handleActionError(error, 'Failed to create {entity}');
  }
}
```

#### 5.1.2 Repository Pattern (MANDATORY)

```typescript
// src/repositories/{entity}-repository.ts
import { Prisma, PrismaClient } from '@/prisma/client';
import { BaseRepository } from '@/lib/baseRepository';

export class {Entity}Repository extends BaseRepository<Prisma.{Entity}GetPayload<object>> {
  constructor(private prisma: PrismaClient) {
    super();
  }

  protected get model() {
    return this.prisma.{entity} as unknown as ModelDelegateOperations<
      Prisma.{Entity}GetPayload<object>
    >;
  }

  async searchAndPaginate(params: {Entity}Filters): Promise<{Entity}Pagination> {
    const whereClause: Prisma.{Entity}WhereInput = {
      deletedAt: null, // ALWAYS REQUIRED
    };
    // ... implementation
  }
}
```

#### 5.1.3 Schema Pattern (MANDATORY)

```typescript
// src/schemas/{module}.ts
import { z } from 'zod';
import { commonValidators, VALIDATION_LIMITS } from '@/lib/validation';
import { {Entity}StatusSchema } from '@/zod/schemas/enums/{Entity}Status.schema';

export const Create{Entity}Schema = z.object({
  // ... fields
});

export const Update{Entity}Schema = Create{Entity}Schema.extend({
  id: z.cuid({ error: 'Invalid {entity} ID' }),
});

export type Create{Entity}Input = z.infer<typeof Create{Entity}Schema>;
export type Update{Entity}Input = z.infer<typeof Update{Entity}Schema>;
```

### 5.2 Frontend Patterns

#### 5.2.1 Query Key Factory (MANDATORY)

```typescript
export const {ENTITY}_KEYS = {
  all: ['{entities}'] as const,
  lists: () => [...{ENTITY}_KEYS.all, 'list'] as const,
  list: (filters: {Entity}Filters) => [...{ENTITY}_KEYS.lists(), { filters }] as const,
  details: () => [...{ENTITY}_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...{ENTITY}_KEYS.details(), id] as const,
  statistics: () => [...{ENTITY}_KEYS.all, 'statistics'] as const,
};
```

#### 5.2.2 Query Hook Pattern (MANDATORY)

```typescript
export function use{Entity}(id: string | undefined) {
  return useQuery({
    queryKey: {ENTITY}_KEYS.detail(id ?? ''),
    queryFn: async () => {
      if (!id) throw new Error('{Entity} ID is required');
      const result = await get{Entity}ById(id);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    enabled: Boolean(id),
    staleTime: 30 * 1000,
  });
}
```

#### 5.2.3 Mutation Hook Pattern (MANDATORY)

```typescript
export function useCreate{Entity}() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Create{Entity}Input) => {
      const result = await create{Entity}(data);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: {ENTITY}_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: {ENTITY}_KEYS.statistics() });
      toast.success('{Entity} created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create {entity}');
    },
  });
}
```

#### 5.2.4 Form Pattern (MANDATORY)

```typescript
const form = useForm<{Entity}FormInput>({
  mode: 'onChange',
  resolver: zodResolver(mode === 'create' ? Create{Entity}Schema : Update{Entity}Schema),
  defaultValues,
});

useUnsavedChanges(form.formState.isDirty);
```

#### 5.2.5 Action Context Pattern (MANDATORY)

```typescript
// src/features/{domain}/{module}/context/{entity}-action-context.tsx
export function {Entity}ActionProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<ModalState | null>(null);
  const deleteMutation = useDelete{Entity}();

  const openDelete = useCallback((id: string, entityNumber?: string, onSuccess?: () => void) => {
    setState({ type: 'DELETE', id, entityNumber, onSuccess });
  }, []);

  // ... other actions

  return (
    <{Entity}ActionContext.Provider value={value}>
      {children}
      <Delete{Entity}Dialog ... />
    </{Entity}ActionContext.Provider>
  );
}

export function use{Entity}Actions() {
  const context = useContext({Entity}ActionContext);
  if (!context) throw new Error('use{Entity}Actions must be used within {Entity}ActionProvider');
  return context;
}
```

#### 5.2.6 Layout Pattern (MANDATORY)

```typescript
// src/app/(protected)/{domain}/{module}/layout.tsx
import { {Entity}ActionProvider } from '@/features/{domain}/{module}/context/{entity}-action-context';

export default function {Entities}Layout({
  children,
  modal,
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

---

## 6. Constraints

### 6.1 TypeScript Constraints

| Rule                                  | Enforcement |
| ------------------------------------- | ----------- |
| No `any` type                         | Build error |
| No `as` type assertions               | Build error |
| No `@ts-ignore`                       | Build error |
| No `@ts-expect-error` without comment | Build error |
| Strict null checks                    | Enabled     |
| No implicit any                       | Enabled     |

### 6.2 Data Access Constraints

| Rule                                      | Enforcement                                 |
| ----------------------------------------- | ------------------------------------------- |
| No direct Prisma calls in actions         | All Prisma calls MUST go through repository |
| All queries MUST filter `deletedAt: null` | Soft delete enforcement                     |
| All Decimal fields MUST convert to Number | JSON serialization compatibility            |
| All repository methods MUST be async      | Consistency                                 |
| Transactions for multi-table operations   | Data integrity                              |

### 6.3 Authentication Constraints

| Rule                                                   | Enforcement                |
| ------------------------------------------------------ | -------------------------- |
| All actions MUST check `auth()`                        | First line of every action |
| All mutations MUST check `requirePermission()`         | After auth check           |
| User context MUST be passed to repository for auditing | `session.user.id`          |

### 6.4 Validation Constraints

| Rule                                                    | Enforcement               |
| ------------------------------------------------------- | ------------------------- |
| All inputs MUST be validated with Zod                   | Before any business logic |
| Schemas MUST use `commonValidators` for standard fields | Consistency               |
| Schemas MUST define max lengths                         | Security                  |
| Schemas MUST be exported with inferred types            | Type safety               |

### 6.5 Error Handling Constraints

| Rule                                       | Enforcement            |
| ------------------------------------------ | ---------------------- |
| All actions MUST use `handleActionError()` | Standardized responses |
| All actions MUST return `ActionResult<T>`  | Type safety            |
| No throwing in actions (except validation) | Graceful degradation   |
| All mutations MUST show toast on error     | User feedback          |

### 6.6 Cache Constraints

| Rule                                            | Enforcement            |
| ----------------------------------------------- | ---------------------- |
| All mutations MUST call `revalidatePath()`      | Server cache           |
| All mutations MUST invalidate React Query cache | Client cache           |
| Statistics queries MUST use `keepPreviousData`  | UX stability           |
| Date filters MUST be normalized for query keys  | Cache hit optimization |

### 6.7 UI Constraints

| Rule                                             | Enforcement          |
| ------------------------------------------------ | -------------------- |
| All forms MUST use `useUnsavedChanges()`         | Data loss prevention |
| All loading states MUST show skeleton or spinner | UX                   |
| All tables MUST prefetch on row hover            | Performance          |
| All drawers MUST preserve URL query params       | Navigation           |
| All dialogs MUST be managed via ActionContext    | Centralization       |

---

## 7. File Templates

### 7.1 Types Template

```typescript
// src/features/{domain}/{module}/types.ts
import type { Create{Entity}Input, Update{Entity}Input } from '@/schemas/{module}';
import type { {Entity}Status } from '@/zod/schemas/enums/{Entity}Status.schema';

export type {Entity}FormInput = Create{Entity}Input | Update{Entity}Input;

export type {Entity}ListItem = {
  id: string;
  {entity}Number: string;
  status: {Entity}Status;
  amount: number;
  // ... other list fields
};

export type {Entity}WithDetails = {
  id: string;
  {entity}Number: string;
  status: {Entity}Status;
  // ... all fields including relations
  createdAt: Date;
  updatedAt: Date;
};

export interface {Entity}Filters {
  search?: string;
  status?: {Entity}Status[];
  page: number;
  perPage: number;
  sort?: { id: string; desc: boolean }[];
}

export type {Entity}Pagination = {
  items: {Entity}ListItem[];
  pagination: {
    totalItems: number;
    totalPages: number;
    currentPage: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    nextPage: number | null;
    previousPage: number | null;
  };
};
```

### 7.2 Permissions Template (Add to existing file)

```typescript
// src/lib/permissions.ts - ADD these entries:

// In PERMISSIONS object:
canRead{Entities}: { label: 'Can view {entities}' },
canManage{Entities}: { label: 'Can create, edit, and delete {entities}' },

// In RolePolicies - USER:
allow: [..., 'canRead{Entities}'],
actions: { allow: [..., '{module}.get{Entities}', '{module}.get{Entity}ById'] },

// In RolePolicies - MANAGER:
allow: [..., 'canManage{Entities}'],
actions: { allow: [..., '{module}.create{Entity}', '{module}.update{Entity}'] },

// In RolePolicies - ADMIN:
actions: { allow: [..., '{module}.delete{Entity}'] },
```

### 7.3 Filter Template

```typescript
// src/filters/{module}/{module}-filters.ts
import { {Entity}StatusSchema } from '@/zod/schemas/enums/{Entity}Status.schema';
import { getSortingStateParser } from '@/lib/parsers';
import { SORTABLE_{ENTITY}_COLUMNS } from '@/features/{domain}/{module}/constants/sortable-columns';
import {
  createSearchParamsCache,
  parseAsInteger,
  parseAsString,
  parseAsArrayOf,
  parseAsStringEnum,
} from 'nuqs/server';

const sortableColumnIds = new Set(SORTABLE_{ENTITY}_COLUMNS);

export const searchParams = {
  search: parseAsString.withDefault(''),
  page: parseAsInteger.withDefault(1),
  perPage: parseAsInteger.withDefault(20),
  status: parseAsArrayOf(
    parseAsStringEnum<{Entity}Status>({Entity}StatusSchema.options),
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

---

## 8. Generation Checklist

When generating a new module, verify ALL items:

### 8.1 Backend Files

- [ ] `src/actions/{module}/mutations.ts` - Create, Update, Delete, status transitions
- [ ] `src/actions/{module}/queries.ts` - Get list, Get by ID, Get statistics
- [ ] `src/actions/{module}/index.ts` - Re-exports all actions
- [ ] `src/repositories/{entity}-repository.ts` - Extends BaseRepository
- [ ] `src/repositories/{entity}-repository.spec.ts` - Unit tests
- [ ] `src/schemas/{module}.ts` - Zod schemas with type exports
- [ ] `src/lib/permissions.ts` - Updated with new permissions

### 8.2 Frontend Files

- [ ] `src/features/{domain}/{module}/types.ts`
- [ ] `src/features/{domain}/{module}/hooks/use-{module}-queries.ts`
- [ ] `src/features/{domain}/{module}/hooks/use-{entity}-query-string.ts`
- [ ] `src/features/{domain}/{module}/context/{entity}-action-context.tsx`
- [ ] `src/features/{domain}/{module}/constants/sortable-columns.ts`
- [ ] `src/features/{domain}/{module}/components/{entity}-view.tsx`
- [ ] `src/features/{domain}/{module}/components/{entity}-list.tsx`
- [ ] `src/features/{domain}/{module}/components/{entity}-table.tsx`
- [ ] `src/features/{domain}/{module}/components/{entity}-columns.tsx`
- [ ] `src/features/{domain}/{module}/components/{entity}-drawer.tsx`
- [ ] `src/features/{domain}/{module}/components/{entity}-form.tsx`
- [ ] `src/features/{domain}/{module}/components/{entity}-drawer-skeleton.tsx`
- [ ] `src/features/{domain}/{module}/components/{entity}-status-badge.tsx`
- [ ] `src/features/{domain}/{module}/components/{entity}-actions.tsx`
- [ ] `src/features/{domain}/{module}/components/delete-{entity}-dialog.tsx`
- [ ] `src/filters/{module}/{module}-filters.ts`

### 8.3 Route Files

- [ ] `src/app/(protected)/{domain}/{module}/layout.tsx`
- [ ] `src/app/(protected)/{domain}/{module}/page.tsx`
- [ ] `src/app/(protected)/{domain}/{module}/[id]/page.tsx`

### 8.4 Validation Checks

- [ ] All TypeScript files compile without errors
- [ ] No `any` types used
- [ ] No `as` assertions used
- [ ] All queries filter `deletedAt: null`
- [ ] All actions return `ActionResult<T>`
- [ ] All mutations invalidate caches
- [ ] All forms use `useUnsavedChanges`
- [ ] All tables prefetch on hover
- [ ] Permissions added for all roles
- [ ] Repository tests pass

---

## Version History

| Version | Date       | Changes                                              |
| ------- | ---------- | ---------------------------------------------------- |
| 1.0.0   | 2026-02-08 | Initial specification extracted from Invoices module |
