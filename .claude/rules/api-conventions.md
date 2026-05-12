# API & Architecture Conventions

## Data Flow

```
UI Component → Hook → Server Action → DB function (src/db/) → Prisma → Database
```

Every layer has a single responsibility. Do not skip layers.

New entities use DB functions in `src/db/<domain>/`. Existing repositories in `src/repositories/` remain until explicitly migrated — see ADR-007.

## Hooks (`src/features/**/hooks/`)

- .
- Handle loading/error state for the UI.
- Pass consolidated input objects to actions (never spread multiple args).
- Export a `ENTITY_KEYS` constant with hierarchical query key structure: `all → lists → details → id → sub-resources`. Example: `CUSTOMER_KEYS.detail(id)`.
- All mutations must implement: `onMutate` (cancel in-flight queries + snapshot) → `onError` (rollback snapshot) → `onSettled` (refetch to sync with server).
- For complex entities with sub-resources (e.g. invoices with items/payments/history), use split cache keys for fine-grained invalidation.

## Server Actions (`src/actions/**/mutations.ts` | `queries.ts`)

- Must start with `'use server'`.
- Must be wrapped in one of the four auth HOFs from `@/lib/action-auth`:
  - `withAuth` — authenticated user, no tenant required.
  - `withTenant` — authenticated user scoped to a tenant, no permission check.
  - `withTenantPermission('permissionKey', ...)` — tenant-scoped with RBAC check. Use for any write or sensitive read.
  - `withSuperAdmin` — super-admin only operations.
- No Prisma calls in actions. All database access goes through a DB function (`src/db/`) or repository (`src/repositories/`).
- No type or interface definitions in action files. Define types in `src/features/**/types.ts`.
- Validate external input with Zod schemas before passing to DB functions or repositories.
- Multi-parameter operations must be consolidated into a single input object type.
- No barrel `index.ts` files in action folders. Import directly from `mutations.ts` or `queries.ts`.
- Every exported action function must have a JSDoc comment.
- All actions must return `ActionResult<T>` — never return raw data or throw. Use `{ success: true, data }` or `{ success: false, error }`.
- Wrap all logic in try/catch and always use `handleActionError(error, 'message')` from `@/lib/error-handler` in the catch block.
- After mutations, call `revalidatePath()` for each affected route (list page + detail page where applicable).

## DB Functions (`src/db/<domain>/`) — new pattern

New database access is written as plain async functions, not classes.

- Files split by concern: `queries.ts`, `mutations.ts`, `analytics.ts`, etc. No barrel `index.ts`.
- First argument is always `prisma: PrismaClient` — enables `getTestPrisma()` injection in tests.
- Function names are entity-scoped and explicit: `findInvoiceById`, not `findById`.
- Every function includes `tenantId` in every `where` clause — including internal re-fetches after mutations.
- Soft-delete queries scope by `tenantId`.
- Unique lookups use `findFirst({ where: { field, tenantId } })`, not `findUnique`.
- Use `getPaginationMetadata(total, perPage, page)` from `@/lib/utils` — never build pagination manually.
- Every exported function must have a multi-line JSDoc comment with `@param` tags and a `@returns` tag.

## Repositories (`src/repositories/*-repository.ts`) — existing, being migrated

Repositories in `src/repositories/` remain in place until explicitly migrated to `src/db/`. Do not add new repositories — new entities go to `src/db/`. See ADR-007.

Rules that still apply to existing repositories:

- Extend `BaseRepository<Prisma.ModelGetPayload<object>>`.
- Constructor takes `private prisma: PrismaClient` and exposes `protected get model()`.
- Method names must be repository-scoped and explicit.
- Every query and mutation must include `tenantId` in the `where` clause.
- Never export a singleton instance. Instantiate with `new XRepository(prisma)` at the call site.
- Every method must have a multi-line JSDoc comment with `@param` and `@returns` tags.

## Schemas (`src/schemas/`)

- All Zod schemas live in `src/schemas/`, never inline in action or repository files.
- Define a `BaseXSchema` with shared fields, then `CreateXSchema` and `UpdateXSchema` as variants.
- Export inferred TypeScript types alongside each schema: `export type CreateXInput = z.infer<typeof CreateXSchema>`.
- The `DeleteXSchema` is always `z.object({ id: z.cuid() })`.

## Filters (`src/filters/**/`)

- Each entity with a data table has a `src/filters/ENTITY/ENTITY-filters.ts` file.
- Exports a `searchParamsCache` singleton (for server components) and a `searchParams` object (for client `useQueryStates`).
- Never parse search params manually — always use `searchParamsCache.parse()`.
- Page components parse raw `SearchParams` into a typed `XFilters` object using `searchParamsCache.parse()` and pass it to `prefetchQuery`. They do **not** pass it as a prop to the list component.
- List components take **no `searchParams` prop**. They read current filter state from the URL via `useQueryStates(entitySearchParams)`.
- Actions receive a typed `XFilters` object. They never call `searchParamsCache.parse()` internally — parsing is the page's responsibility.

## Types (`src/features/**/types.ts`)

- All domain types and interfaces live here.
- Never extend Prisma model types directly — Prisma uses `Decimal` for numeric fields. Define explicit plain types and convert with `Number()` at the DB function or repository boundary.
- Never use `any` — including in private mapper method parameters. Use an explicit inline shape or a named type.
- Schema input types (`CreateXInput`, `UpdateXInput`) live in `src/schemas/` and are inferred from Zod schemas.
