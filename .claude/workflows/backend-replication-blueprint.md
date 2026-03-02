---
description: Backend Replication Blueprint - architectural patterns extracted from Invoices module
---

# Backend Replication Blueprint

This document defines the authoritative architectural patterns for backend modules in this codebase. All new modules **MUST** follow these patterns exactly. Extracted from the **Invoices** module.

---

## 1. Folder Structure Pattern

```
src/
├── actions/
│   └── {module}/
│       ├── mutations.ts      # Write operations (create, update, delete)
│       ├── queries.ts        # Read operations (get, list, search)
│       └── mutations.spec.ts # Unit tests for mutations
│
├── repositories/
│   ├── {module}-repository.ts       # Data access layer
│   └── {module}-repository.spec.ts  # Repository unit tests
│
├── schemas/
│   └── {module}.ts           # Zod validation schemas
│
├── filters/
│   └── {module}/
│       └── {module}-filters.ts  # nuqs search params cache
│
├── features/
│   └── {domain}/{module}/
│       ├── components/       # React components
│       ├── config/           # Module configuration
│       ├── constants/        # Static values (sortable columns, etc.)
│       ├── context/          # React context providers
│       ├── hooks/            # Custom hooks
│       ├── services/         # Domain services (PDF, email, etc.)
│       ├── utils/            # Helper functions
│       └── types.ts          # Module-specific types
│
├── types/
│   └── actions.ts            # ActionResult type
│
└── lib/
    ├── baseRepository.ts     # Abstract repository base class
    ├── error-handler.ts      # Standardized error handling
    ├── logger.ts             # Logging utility
    ├── permissions.ts        # RBAC permissions
    ├── validation.ts         # Common validators and limits
    └── retry.ts              # Database retry utilities
```

---

## 2. Layering Pattern (Action → Repository)

### Layer Responsibilities

| Layer          | Location                | Responsibility                                                           |
| -------------- | ----------------------- | ------------------------------------------------------------------------ |
| **Action**     | `src/actions/{module}/` | Auth, permission check, validation, orchestration, revalidation          |
| **Repository** | `src/repositories/`     | All database operations, transactions, business logic isolated from HTTP |

### Action Layer (Controller Equivalent)

```typescript
// src/actions/{module}/mutations.ts
'use server';

import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';
import { {Entity}Repository } from '@/repositories/{module}-repository';
import { prisma } from '@/lib/prisma';
import { handleActionError } from '@/lib/error-handler';
import { logger } from '@/lib/logger';
import { requirePermission } from '@/lib/permissions';
import { Create{Entity}Schema, type Create{Entity}Input } from '@/schemas/{module}';
import type { ActionResult } from '@/types/actions';

const {entity}Repo = new {Entity}Repository(prisma);

export async function create{Entity}(
  data: Create{Entity}Input,
): Promise<ActionResult<{ id: string }>> {
  // 1. Authentication
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    // 2. Authorization
    requirePermission(session.user, 'canManage{Entities}');

    // 3. Validation
    const validatedData = Create{Entity}Schema.parse(data);

    // 4. Business operation (delegate to repository)
    const result = await {entity}Repo.create{Entity}WithItems(validatedData, session.user.id);

    // 5. Cache revalidation
    revalidatePath('/{domain}/{module}');

    // 6. Return typed result
    return { success: true, data: { id: result.id } };
  } catch (error) {
    return handleActionError(error, 'Failed to create {entity}');
  }
}
```

### Query Pattern

```typescript
// src/actions/{module}/queries.ts
'use server';

import { auth } from '@/auth';
import { SearchParams } from 'nuqs/server';
import { {Entity}Repository } from '@/repositories/{module}-repository';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/permissions';
import { handleActionError } from '@/lib/error-handler';
import type { {Entity}Pagination, {Entity}WithDetails } from '@/features/{domain}/{module}/types';
import type { ActionResult } from '@/types/actions';
import { searchParamsCache } from '@/filters/{module}/{module}-filters';

const {entity}Repo = new {Entity}Repository(prisma);

export async function get{Entities}(
  searchParams: SearchParams,
): Promise<ActionResult<{Entity}Pagination>> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    requirePermission(session.user, 'canRead{Entities}');

    // Parse search params via nuqs cache
    const filters = searchParamsCache.parse(searchParams);
    const result = await {entity}Repo.searchAndPaginate(filters);

    return { success: true, data: result };
  } catch (error) {
    return handleActionError(error, 'Failed to fetch {entities}');
  }
}
```

---

## 3. Repository Pattern

### Base Repository Extension

```typescript
// src/repositories/{module}-repository.ts
import { Prisma, PrismaClient, {Entity}Status } from '@/prisma/client';
import { BaseRepository, type ModelDelegateOperations } from '@/lib/baseRepository';
import { isPrismaError } from '@/lib/error-handler';
import { withDatabaseRetry } from '@/lib/retry';

import type {
  {Entity}ListItem,
  {Entity}WithDetails,
  {Entity}Filters,
  {Entity}Pagination,
} from '@/features/{domain}/{module}/types';
import { getPaginationMetadata } from '@/lib/utils';

import type { Create{Entity}Input, Update{Entity}Input } from '@/schemas/{module}';

export class {Entity}Repository extends BaseRepository<Prisma.{Entity}GetPayload<object>> {
  constructor(private prisma: PrismaClient) {
    super();
  }

  protected get model(): ModelDelegateOperations<Prisma.{Entity}GetPayload<object>> {
    return this.prisma.{entity} as unknown as ModelDelegateOperations<
      Prisma.{Entity}GetPayload<object>
    >;
  }

  // Custom methods below...
}
```

### Key Repository Patterns

#### Soft Delete Filtering

```typescript
const whereClause: Prisma.{Entity}WhereInput = {
  deletedAt: null, // Always exclude soft-deleted records
};
```

#### Search and Paginate

```typescript
async searchAndPaginate(params: {Entity}Filters): Promise<{Entity}Pagination> {
  const { search, status, page, perPage, sort } = params;

  const whereClause: Prisma.{Entity}WhereInput = {
    deletedAt: null,
  };

  // Status filter
  if (status && status.length > 0) {
    whereClause.status = { in: status };
  }

  // Full-text search
  if (search) {
    const searchFilter: Prisma.StringFilter = {
      contains: search,
      mode: Prisma.QueryMode.insensitive,
    };
    whereClause.OR = [
      { {entity}Number: searchFilter },
      { customer: { OR: [{ firstName: searchFilter }, { lastName: searchFilter }] } },
    ];
  }

  // Pagination
  const skip = page > 0 ? perPage * (page - 1) : 0;

  // Sorting
  const orderBy: Prisma.{Entity}OrderByWithRelationInput[] =
    sort && sort.length > 0
      ? sort.map((sortItem) => {
          const order: Prisma.SortOrder = sortItem.desc ? 'desc' : 'asc';
          return { [sortItem.id]: order };
        })
      : [{ {entity}Number: 'desc' }];

  // Parallel execution for count + data
  const [totalItems, items] = await Promise.all([
    this.prisma.{entity}.count({ where: whereClause }),
    this.prisma.{entity}.findMany({
      where: whereClause,
      include: { customer: { select: { id: true, firstName: true, lastName: true } } },
      orderBy,
      skip,
      take: perPage,
    }),
  ]);

  return {
    items: items.map(mapToListItem),
    pagination: getPaginationMetadata(totalItems, perPage, page),
  };
}
```

#### Transaction Pattern

```typescript
async create{Entity}WithItems(
  data: Create{Entity}Input,
  createdBy?: string,
): Promise<{ id: string }> {
  return await this.prisma.$transaction(async (tx) => {
    // 1. Create main entity
    const entity = await tx.{entity}.create({
      data: { /* ... */ },
    });

    // 2. Create related entities
    await tx.{entity}StatusHistory.create({
      data: {
        {entity}Id: entity.id,
        status: data.status,
        previousStatus: null,
        updatedBy: createdBy,
      },
    });

    return { id: entity.id };
  });
}
```

#### Retry Pattern for Critical Operations

```typescript
const [data1, data2] = await withDatabaseRetry(() =>
  Promise.all([
    this.prisma.{entity}.groupBy({ /* ... */ }),
    this.prisma.$queryRaw<[{ avg: number }]>(avgQuery),
  ]),
);
```

---

## 4. Prisma Usage Style

### Import Pattern

```typescript
import { Prisma, PrismaClient, {Entity}Status } from '@/prisma/client';
import { prisma } from '@/lib/prisma';
```

### Type Inference

```typescript
// For entity types with relations
Prisma.{Entity}GetPayload<object>

// For where clauses
Prisma.{Entity}WhereInput

// For order by
Prisma.{Entity}OrderByWithRelationInput

// For string search
Prisma.StringFilter
Prisma.QueryMode.insensitive
```

### Decimal to Number Conversion

```typescript
// Prisma returns Decimal; convert to number for JSON serialization
return {
  ...entity,
  amount: Number(entity.amount),
  gst: Number(entity.gst),
};
```

### Select vs Include

```typescript
// Use SELECT for explicit fields (performance)
select: {
  id: true,
  {entity}Number: true,
  status: true,
  customer: {
    select: { id: true, firstName: true, lastName: true },
  },
}

// Use _count for relationship counts
_count: {
  select: { items: true, payments: true },
}
```

---

## 5. Validation Strategy

### Schema Location

```
src/schemas/{module}.ts
```

### Schema Structure

```typescript
import { z } from 'zod';
import { {Entity}StatusSchema } from '@/zod/schemas/enums/{Entity}Status.schema';
import { commonValidators, VALIDATION_LIMITS } from '@/lib/validation';
import { baseFiltersSchema, createEnumArrayFilter } from '@/schemas/common';

// Item schema for nested objects
export const {Entity}ItemSchema = z.object({
  id: z.cuid().optional(), // Optional for new items
  description: z.string().trim()
    .min(1, { error: 'Description is required' })
    .max(VALIDATION_LIMITS.DESCRIPTION_MAX),
  quantity: z.number().int().positive().max(10000),
  unitPrice: z.number().nonnegative().max(1000000),
  productId: z.cuid().nullable(),
});

// Main entity schema
export const {Entity}Schema = z.object({
  customerId: z.cuid({ error: 'Customer ID is required' }),
  status: {Entity}StatusSchema,
  issuedDate: z.date({ error: 'Issued date is required' }),
  dueDate: z.date({ error: 'Due date is required' }),
  currency: z.string().length(3),
  gst: z.number().min(VALIDATION_LIMITS.GST_MIN).max(VALIDATION_LIMITS.GST_MAX),
  discount: z.number().min(0).max(1000000),
  notes: z.string().max(VALIDATION_LIMITS.NOTES_MAX).optional(),
  items: z.array({Entity}ItemSchema).min(1).max(100),
}).refine((data) => data.dueDate >= data.issuedDate, {
  error: 'Due date must be on or after issued date',
  path: ['dueDate'],
});

// Create/Update schemas
export const Create{Entity}Schema = {Entity}Schema;
export const Update{Entity}Schema = {Entity}Schema.safeExtend({
  id: z.cuid({ error: 'Invalid {entity} ID' }),
});

// Filter schema for search params
export const {Entity}FiltersSchema = baseFiltersSchema.extend({
  status: createEnumArrayFilter({Entity}StatusSchema),
});

// Type exports
export type Create{Entity}Input = z.infer<typeof Create{Entity}Schema>;
export type Update{Entity}Input = z.infer<typeof Update{Entity}Schema>;
```

### Validation in Actions

```typescript
try {
  const validatedData = Create{Entity}Schema.parse(data);
  // Use validatedData...
} catch (error) {
  return handleActionError(error, 'Validation failed');
}
```

---

## 6. Error Handling Approach

### Central Error Handler

```typescript
// src/lib/error-handler.ts
import { handleActionError } from '@/lib/error-handler';

// In actions:
try {
  // operation
} catch (error) {
  return handleActionError(error, 'Failed to {operation}');
}

// With context for debugging:
return handleActionError(error, 'Failed to {operation}', {
  action: '{actionName}',
  userId: session.user.id,
  entityId: data.id,
});
```

### ActionResult Type (REQUIRED)

```typescript
// src/types/actions.ts
export type ActionResult<T> =
  | { success: true; data: T; message?: string }
  | {
      success: false;
      error: string;
      code?: ErrorCode;
      errors?: Record<string, string[]>;
      context?: Record<string, unknown>;
    };
```

### Error Handler Features

- Handles `ZodError` → field-level validation errors
- Handles `Prisma.PrismaClientKnownRequestError` → database errors
- Handles `AppError` → custom application errors
- Wraps unknown errors with fallback message

### Type Guard

```typescript
import { isPrismaError } from '@/lib/error-handler';

if (isPrismaError(error) && error.code === 'P2002') {
  // Handle unique constraint violation
}
```

---

## 7. Logging Pattern

### Import

```typescript
import { logger } from '@/lib/logger';
```

### Usage Pattern

```typescript
// Info with context
logger.info('Payment recorded', {
  context: 'recordPayment',
  metadata: {
    invoiceId: invoice.id,
    amount: amount.toString(),
  },
});

// Warning
logger.warn('Receipt number missing, generating now', {
  context: 'sendReceipt',
  metadata: { invoiceId: id },
});

// Error with exception
logger.error('Failed to queue email', err, {
  context: 'sendReminder',
  metadata: { invoiceId: invoice.id },
});
```

### Contextual Logger

```typescript
import { createLogger } from '@/lib/logger';

const log = createLogger('InvoiceService');
log.info('Processing complete', { invoiceId });
```

---

## 8. Multi-Tenancy Enforcement

### Current Pattern: Session-Based User Context

```typescript
// Authentication check (every action)
const session = await auth();
if (!session?.user) {
  return { success: false, error: 'Unauthorized' };
}

// User context passed to repository methods
await repo.markAsPending(id, session.user.id);
```

### Status History Tracking

```typescript
await tx.{entity}StatusHistory.create({
  data: {
    {entity}Id: entity.id,
    status: newStatus,
    previousStatus: currentStatus,
    updatedBy: userId, // Track who made the change
    updatedAt: new Date(),
    notes: 'Reason for change',
  },
});
```

### Soft Delete Pattern

```typescript
// All queries MUST exclude soft-deleted records
where: { id, deletedAt: null }

// Soft delete implementation
await this.prisma.{entity}.update({
  where: { id, deletedAt: null },
  data: {
    deletedAt: new Date(),
    updatedAt: new Date(),
  },
});
```

---

## 9. Pagination/Filter Pattern

### Filter Types

```typescript
// src/features/{domain}/{module}/types.ts
export interface {Entity}Filters {
  search?: string;
  status?: {Entity}Status[];
  page: number;
  perPage: number;
  sort?: { id: string; desc: boolean }[];
}
```

### nuqs Search Params Cache

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
```

### Pagination Response

```typescript
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

### Utility Function

```typescript
import { getPaginationMetadata } from '@/lib/utils';

const pagination = getPaginationMetadata(totalItems, perPage, page);
```

---

## 10. Type Conventions

### Location

```
src/features/{domain}/{module}/types.ts
```

### Naming Conventions

| Type                 | Pattern               | Example              |
| -------------------- | --------------------- | -------------------- |
| List item            | `{Entity}ListItem`    | `InvoiceListItem`    |
| Full details         | `{Entity}WithDetails` | `InvoiceWithDetails` |
| Basic (no relations) | `{Entity}Basic`       | `InvoiceBasic`       |
| Pagination           | `{Entity}Pagination`  | `InvoicePagination`  |
| Filters              | `{Entity}Filters`     | `InvoiceFilters`     |
| Statistics           | `{Entity}Statistics`  | `InvoiceStatistics`  |
| Nested items         | `{Entity}ItemDetail`  | `InvoiceItemDetail`  |
| Form input           | `{Entity}FormInput`   | `InvoiceFormInput`   |

### Schema-Derived Types

```typescript
// src/schemas/{module}.ts
export type Create{Entity}Input = z.infer<typeof Create{Entity}Schema>;
export type Update{Entity}Input = z.infer<typeof Update{Entity}Schema>;
```

### Feature Types

```typescript
// src/features/{domain}/{module}/types.ts
import type { Create{Entity}Input, Update{Entity}Input } from '@/schemas/{module}';
import type { {Entity}Status } from '@/zod/schemas/enums/{Entity}Status.schema';

export type {Entity}FormInput = Create{Entity}Input | Update{Entity}Input;

export type {Entity}ListItem = {
  id: string;
  {entity}Number: string;
  customerId: string;
  customerName: string;
  status: {Entity}Status;
  amount: number;
  currency: string;
  // ... scalar fields only
};

export type {Entity}WithDetails = {
  id: string;
  {entity}Number: string;
  status: {Entity}Status;
  amount: number;
  // ... all scalar fields
  customer: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  items: {Entity}ItemDetail[];
  statusHistory: {Entity}StatusHistoryItem[];
  createdAt: Date;
  updatedAt: Date;
};
```

---

## 11. Permission Pattern

### Permissions Definition

```typescript
// src/lib/permissions.ts
export const PERMISSIONS = {
  canRead{Entities}: { label: 'Can view {entities}' },
  canManage{Entities}: { label: 'Can create, edit, cancel, and delete {entities}' },
} as const;
```

### Usage in Actions

```typescript
import { requirePermission } from '@/lib/permissions';

// Check permission (throws if denied)
requirePermission(session.user, 'canManage{Entities}');

// Check permission (returns boolean)
if (!hasPermission(session.user, 'canRead{Entities}')) {
  return { success: false, error: 'Unauthorized' };
}
```

---

## 12. Cache Revalidation Pattern

```typescript
import { revalidatePath } from 'next/cache';

// After mutations
revalidatePath('/{domain}/{module}');
revalidatePath(`/{domain}/{module}/${entity.id}`);

// Cross-module revalidation when needed
revalidatePath('/finances/transactions');
```

---

## 13. Testing Patterns

### Repository Tests

```typescript
// src/repositories/{module}-repository.spec.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { {Entity}Repository } from './{module}-repository';
import { {Entity}Status } from '@/prisma/client';

const mockPrisma = {
  {entity}: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    count: vi.fn(),
    groupBy: vi.fn(),
  },
  {entity}StatusHistory: {
    create: vi.fn(),
  },
  $transaction: vi.fn((input) => {
    if (Array.isArray(input)) return Promise.all(input);
    return input(mockPrisma);
  }),
  $queryRaw: vi.fn(),
};

describe('{Entity}Repository', () => {
  let repository: {Entity}Repository;

  beforeEach(() => {
    vi.clearAllMocks();
    // @ts-ignore - manual mock of PrismaClient
    repository = new {Entity}Repository(mockPrisma);
  });

  describe('findByIdWithDetails', () => {
    it('returns entity with details when it exists', async () => {
      const mockEntity = { id: 'ent_123', {entity}Number: 'ENT-001' };
      mockPrisma.{entity}.findUnique.mockResolvedValue(mockEntity);

      const result = await repository.findByIdWithDetails('ent_123');

      expect(result?.{entity}Number).toBe('ENT-001');
      expect(mockPrisma.{entity}.findUnique).toHaveBeenCalled();
    });

    it('returns null when entity does not exist', async () => {
      mockPrisma.{entity}.findUnique.mockResolvedValue(null);
      const result = await repository.findByIdWithDetails('non_existent');
      expect(result).toBeNull();
    });
  });
});
```

---

## Checklist for New Modules

When creating a new module, ensure all these files exist:

- [ ] `src/actions/{module}/mutations.ts`
- [ ] `src/actions/{module}/queries.ts`
- [ ] `src/repositories/{module}-repository.ts`
- [ ] `src/repositories/{module}-repository.spec.ts`
- [ ] `src/schemas/{module}.ts`
- [ ] `src/filters/{module}/{module}-filters.ts`
- [ ] `src/features/{domain}/{module}/types.ts`
- [ ] `src/features/{domain}/{module}/constants/sortable-columns.ts`
- [ ] Permission keys added to `src/lib/permissions.ts`

---

## Anti-Patterns (DO NOT DO)

1. ❌ Direct Prisma calls in actions (use repository)
2. ❌ Using `any` type
3. ❌ Using `as` type assertions
4. ❌ Returning raw Decimal from Prisma (convert to Number)
5. ❌ Forgetting `deletedAt: null` in where clauses
6. ❌ Missing session authentication check
7. ❌ Missing permission check
8. ❌ Using `try-catch` without `handleActionError`
9. ❌ Inline validation instead of schema
10. ❌ Missing cache revalidation after mutations
