# Las Flores Melbourne - Project Instructions for Claude

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## CRITICAL: NEVER USE npm OR npx

**This is non-negotiable. lfm-admin ONLY works with pnpm.**

lfm-admin uses pnpm with custom plugins that configure the entire development environment and enable workspace features essential to the monorepo. Using npm or npx will completely break the development environment.

| NEVER USE                 | ALWAYS USE                 |
| ------------------------- | -------------------------- |
| `npm install`             | `pnpm` or `pnpm install`   |
| `npm run build`           | `pnpm build`               |
| `npm add package`         | `pnpm add package`         |
| `npx prisma migrate dev`  | `pnpm prisma migrate dev`  |
| `npx tsx scripts/seed.ts` | `pnpm tsx scripts/seed.ts` |
| `npx vitest`              | `pnpm vitest`              |
| `npx playwright test`     | `pnpm playwright test`     |
| `npx <any-command>`       | `pnpm <any-command>`       |

**Rule of thumb:** If you see `npm` or `npx` in a command, STOP and convert it to `pnpm`.

---

## Tech Stack

- **Frontend**: Next.js, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Prisma ORM
- **Database**: Neon PostgreSQL
- **Auth**: NextAuth
- **Tests**: Vitest, Playwright
- **Jobs**: Inngest for background processing
- **Package manager**: pnpm

---

## Architecture

### Folder structure

```
src/
├── actions/                        # Server actions (mutations + queries)
│   ├── crm/
│   │   ├── customers/
│   │   │   ├── mutations.ts
│   │   │   └── queries.ts
│   │   └── organizations/
│   │       ├── mutations.ts
│   │       └── queries.ts
│   ├── finances/
│   ├── inventory/
│   ├── staff/
│   ├── settings/
│   └── tasks/
├── features/                       # UI feature modules
│   ├── crm/
│   │   └── customers/
│   │       ├── components/         # Feature-specific React components
│   │       ├── hooks/              # React Query hooks (call actions only)
│   │       ├── constants/
│   │       ├── utils/
│   │       └── types.ts            # All domain types for this feature
│   ├── finances/
│   ├── inventory/
│   └── staff/
├── repositories/                   # Database access layer
│   ├── customer-repository.ts
│   └── ...
├── schemas/                        # Zod schemas + inferred input types
│   ├── customers.ts
│   └── ...
├── filters/                        # nuqs search param parsers per domain
├── components/                     # Shared/global UI components
├── lib/                            # Utilities, auth, base classes
├── app/                            # Next.js route handlers and pages
└── types/                          # Global shared TypeScript types
```

### Data flow

```
UI Component → Hook → Server Action → Repository → Prisma → Database
```

Every layer has a single responsibility. Do not skip layers.

### Hooks (`src/features/**/hooks/`)

- Call server actions only — no direct Prisma or repository calls.
- Handle loading/error state for the UI.
- Pass consolidated input objects to actions (never spread multiple args).
- Export a `ENTITY_KEYS` constant with hierarchical query key structure: `all → lists → details → id → sub-resources`. Example: `CUSTOMER_KEYS.detail(id)`.
- All mutations must implement: `onMutate` (cancel in-flight queries + snapshot) → `onError` (rollback snapshot) → `onSettled` (refetch to sync with server).
- For complex entities with sub-resources (e.g. invoices with items/payments/history), use split cache keys for fine-grained invalidation.

### Server Actions (`src/actions/**/mutations.ts` | `queries.ts`)

- Must start with `'use server'`.
- Must be wrapped in one of the four auth HOFs from `@/lib/action-auth`:
  - `withAuth` — authenticated user, no tenant required (e.g. file uploads, task management).
  - `withTenant` — authenticated user scoped to a tenant, no permission check.
  - `withTenantPermission('permissionKey', ...)` — tenant-scoped with RBAC check. Use for any write or sensitive read.
  - `withSuperAdmin` — super-admin only operations.
- **No Prisma calls in actions.** All database access goes through a repository.
- **No type or interface definitions in action files.** Define types in `src/features/**/types.ts`.
- Validate external input with Zod schemas before passing to repositories.
- Multi-parameter operations must be consolidated into a single input object type.
- No barrel `index.ts` files in action folders. Import directly from `mutations.ts` or `queries.ts`.
- Every exported action function must have a JSDoc comment describing its purpose, parameters, and return value.
- All actions must return `ActionResult<T>` — never return raw data or throw. Use `{ success: true, data }` or `{ success: false, error }`.
- Wrap all logic in try/catch and always use `handleActionError(error, 'message')` from `@/lib/error-handler` in the catch block.
- After mutations, call `revalidatePath()` for each affected route (list page + detail page where applicable).

### Repositories (`src/repositories/*-repository.ts`)

- Extend `BaseRepository<Prisma.ModelGetPayload<object>>`.
- Constructor takes `private prisma: PrismaClient` and exposes `protected get model()`.
- **No type or interface definitions in repository files.** Import from `src/features/**/types.ts` or `src/schemas/`.
- Method names must be repository-scoped and explicit:
  - `findCustomerById`, not `findById`
  - `softDeleteCustomer`, not `softDelete`
  - `searchCustomers`, not `searchAndPaginate`
  - `findCustomerByEmail(email, tenantId)`, not `findByEmail(email)`
- **Every** query and mutation must include `tenantId` in the `where` clause — including internal calls made after an update (e.g. re-fetching the updated record via `findXById`).
- Soft-delete methods must also scope by `tenantId` to prevent cross-tenant deletions.
- Unique lookups (e.g. by email) must be scoped to `tenantId` — use `findFirst({ where: { email, tenantId } })` not `findUnique({ where: { email } })`.
- Use `getPaginationMetadata(total, perPage, page)` from `@/lib/utils` — never build pagination manually.
- Private helper methods (e.g. row mappers) belong inside the class, not at module level.
- Every repository method (public and private) must have a JSDoc comment describing its purpose, parameters, and return value.

### Schemas (`src/schemas/`)

- All Zod schemas live in `src/schemas/`, never inline in action or repository files.
- Define a `BaseXSchema` with shared fields, then `CreateXSchema` and `UpdateXSchema` as variants.
- Export inferred TypeScript types alongside each schema: `export type CreateXInput = z.infer<typeof CreateXSchema>`.
- The `DeleteXSchema` is always `z.object({ id: z.cuid() })`.

### Filters (`src/filters/**/`)

- Each entity with a data table has a `src/filters/ENTITY/ENTITY-filters.ts` file.
- Exports a `searchParamsCache` singleton (for server components) and a `searchParams` object (for page props).
- Never parse search params manually — always use the `searchParamsCache.parse()` method.

### Types (`src/features/**/types.ts`)

- All domain types and interfaces live here.
- Never extend Prisma model types directly — Prisma uses `Decimal` for numeric fields which conflicts with `number`. Define explicit plain types and convert with `Number()` at the repository boundary.
- Never use `any` — including in private mapper method parameters. Use an explicit inline shape or a named type.
- Schema input types (`CreateXInput`, `UpdateXInput`) live in `src/schemas/` and are inferred from Zod schemas.

---

## Code Quality Standards

- **No type assertions.** Never use `as any` or `as Type`. Use inference or type guards. Ask if stuck.
- **No `eslint-disable` comments** to work around type assertion lint rules. Fix the underlying type instead.
- **No `any` type.** If unsure, use `unknown` and add a type guard.
- **No `console.log/error`.** Use the `logger` helper instead. Always pass `{ context: 'descriptiveString', metadata: {} }` as the second argument.
- **No `null` for missing data.** Use `undefined` instead of `null` for optional values.
- **No `!` (non-null assertion).** Use optional chaining (`?.`) or type guards instead.
- **No `!!` (double negation).** Use `Boolean()` or type guards instead.
- **No `void` return types on functions.** Use `Promise<void>` for async, `void` for sync only where genuinely needed.
- **Parallel over sequential.** Prefer concurrent operations (`Promise.all`) when possible.
- **Files over 500 lines** must be split into modules.
- **Validation limits** (name max length, search query max, per-page max, etc.) must be defined in `VALIDATION_LIMITS` in `src/lib/validation.ts` — never hardcode magic numbers.
- **Permission keys** are formatted as `canReadX` / `canManageX`. Action permission strings are formatted as `entity.actionName` (e.g. `invoices.createInvoice`). Both live in `src/lib/permissions.ts`.
- **Imports order**: external packages → internal modules → types.
- **Naming**: `camelCase` functions, `PascalCase` components/types, `kebab-case` files.

---

## Working Standards

### Scope

- Do what has been asked — nothing more, nothing less.
- Ask when ambiguous. Don't do more than requested.
- Verify work is complete: all instances updated, all deps added, duplicates eliminated.
- NEVER create files unless absolutely necessary. Always prefer editing an existing file.
- NEVER proactively create documentation files (`*.md`) or README files unless explicitly requested.

### Problem solving

- Don't jump to quick fixes — understand the root cause first.
- Look at ALL related files, not just one.
- Search for existing implementations before creating new ones.
- Always read a file before editing it.
- When a solution fails, propose alternative approaches and ask the user how to proceed.

### Style

- No emojis in code or docs unless explicitly requested.
- Comment section headers: `// -- Heading text ------...` (dash style to column 80, never `// ===`).
- Brief PR descriptions — no marketing copy, no elaborate benefits/trade-offs sections.

### Most common mistakes

1. Over-engineering — adding unnecessary complexity, helpers, abstractions.
2. Wrong APIs — always verify API names exist before using (e.g. `useFlag` not `useFeatureFlag`).
3. Incomplete work — missing package.json deps, partial implementations, unchecked call sites.
4. Type assertions — use proper typing, never `as any`.
5. Skipping layers — calling Prisma from actions, or calling repos from hooks.

---

## Language & Localisation

**Use Australian English spelling and conventions throughout the codebase.**

- Favour → not favor
- Colour → not color
- Organisation → not organization
- Enrolment → not enrollment
- Centre → not center
- Analyse → not analyze

When writing user-facing text, documentation, or code comments, always use Australian English.

---

## Testing

- Required for all new features: Vitest unit tests.
- Test structure: mirror app structure, `__tests__` next to components where applicable.
- Minimum coverage: expected behaviour + edge case + error handling.
- No obvious comments in tests — don't restate what the code does (e.g. `// Import after mocking`). The code should speak for itself.

---

## Git & Pull Requests

- Do NOT add `Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>` to commit messages.
- Do NOT add `Generated with Claude Code` to PR descriptions.
- Keep commit messages clean using Conventional Commits format.
- NEVER commit secrets, credentials, or `.env` files.
- Check `git diff` when writing PR descriptions.
