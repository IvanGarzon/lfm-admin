# API & Architecture Conventions

## Data Flow

```
UI Component → Hook → Server Action → Repository → Prisma → Database
```

Every layer has a single responsibility. Do not skip layers.

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
- No Prisma calls in actions. All database access goes through a repository.
- No type or interface definitions in action files. Define types in `src/features/**/types.ts`.
- Validate external input with Zod schemas before passing to repositories.
- Multi-parameter operations must be consolidated into a single input object type.
- No barrel `index.ts` files in action folders. Import directly from `mutations.ts` or `queries.ts`.
- Every exported action function must have a JSDoc comment.
- All actions must return `ActionResult<T>` — never return raw data or throw. Use `{ success: true, data }` or `{ success: false, error }`.
- Wrap all logic in try/catch and always use `handleActionError(error, 'message')` from `@/lib/error-handler` in the catch block.
- After mutations, call `revalidatePath()` for each affected route (list page + detail page where applicable).

## Repositories (`src/repositories/*-repository.ts`)

- Extend `BaseRepository<Prisma.ModelGetPayload<object>>`.
- Constructor takes `private prisma: PrismaClient` and exposes `protected get model()`.
- Method names must be repository-scoped and explicit:
  - `findCustomerById`, not `findById`
  - `softDeleteCustomer`, not `softDelete`
  - `searchCustomers`, not `searchAndPaginate`
  - `findCustomerByEmail(email, tenantId)`, not `findByEmail(email)`
- Every query and mutation must include `tenantId` in the `where` clause — including internal re-fetches after updates.
- Soft-delete methods must also scope by `tenantId`.
- Unique lookups must be scoped to `tenantId` — use `findFirst({ where: { email, tenantId } })` not `findUnique({ where: { email } })`.
- Use `getPaginationMetadata(total, perPage, page)` from `@/lib/utils` — never build pagination manually.
- Private helper methods belong inside the class, not at module level.
- Never export a singleton instance from a repository file. Instantiate with `new XRepository(prisma)` at the top of each action file that needs it.
- Every repository method (public and private) must have a multi-line JSDoc comment with `@param` tags for each parameter and a `@returns` tag. Single-line `/** ... */` comments are not acceptable. Follow this format:
  ```ts
  /**
   * Short description of what the method does.
   * @param paramName - What this parameter controls
   * @returns What the promise resolves to, including the null/false case where applicable
   */
  ```

## Schemas (`src/schemas/`)

- All Zod schemas live in `src/schemas/`, never inline in action or repository files.
- Define a `BaseXSchema` with shared fields, then `CreateXSchema` and `UpdateXSchema` as variants.
- Export inferred TypeScript types alongside each schema: `export type CreateXInput = z.infer<typeof CreateXSchema>`.
- The `DeleteXSchema` is always `z.object({ id: z.cuid() })`.

## Filters (`src/filters/**/`)

- Each entity with a data table has a `src/filters/ENTITY/ENTITY-filters.ts` file.
- Exports a `searchParamsCache` singleton (for server components) and a `searchParams` object (for page props).
- Never parse search params manually — always use `searchParamsCache.parse()`.

## Types (`src/features/**/types.ts`)

- All domain types and interfaces live here.
- Never extend Prisma model types directly — Prisma uses `Decimal` for numeric fields. Define explicit plain types and convert with `Number()` at the repository boundary.
- Never use `any` — including in private mapper method parameters. Use an explicit inline shape or a named type.
- Schema input types (`CreateXInput`, `UpdateXInput`) live in `src/schemas/` and are inferred from Zod schemas.
