# ADR 002: Repository Pattern for Database Access

Status: Accepted

## Context

Early in the project, server actions called Prisma directly. This caused two problems:

1. **Tenant isolation was inconsistent.** `tenantId` filtering was applied ad-hoc and easy to forget. A missing `where: { tenantId }` clause would silently return or mutate data across tenants.
2. **No single place to enforce database conventions.** Pagination, soft-delete, and field mapping logic was duplicated across action files.

We needed a boundary layer that could enforce tenant scoping by convention, not by discipline.

## Decision

All database access goes through repository classes in `src/repositories/`. No Prisma calls in server actions.

- Every repository extends `BaseRepository<Prisma.ModelGetPayload<object>>`.
- Every repository method accepts `tenantId` and includes it in every `where` clause — including internal re-fetches after mutations.
- Unique lookups use `findFirst({ where: { field, tenantId } })`, not `findUnique`, to enforce tenant scope.
- Method names are repository-scoped and explicit: `findCustomerById`, not `findById`.
- Pagination uses `getPaginationMetadata()` from `@/lib/utils` — never built manually.

## Justification

- Tenant scoping is structural, not optional. Missing it causes a compile error, not a silent data leak.
- Database conventions (pagination, soft-delete, field mapping) have one place to live.
- Repository tests run against a real database, making tenant isolation a tested guarantee rather than a code review concern.

## Alternatives

- **Prisma in actions directly**: Faster to write initially. Tenant scoping becomes a discipline problem — one missed `tenantId` leaks cross-tenant data. Rejected.
- **Service layer instead of repository**: Repositories focus on data access only; a service layer would mix business logic with DB concerns. Rejected to keep responsibilities clear.

## Consequences

- Actions must never import `prisma` directly. All DB access goes via a repository instance.
- Repositories must be tested with real database calls — no Prisma mocks.
- New entities require a new repository file before any action can be written for them.
