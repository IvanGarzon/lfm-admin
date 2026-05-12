# ADR 007: DB Functions Over Repository Pattern for Database Access

Status: Accepted
Supersedes: ADR-002 (partially — existing repositories stay until migrated)

## Context

ADR-002 introduced repository classes (`src/repositories/`) extending `BaseRepository` to enforce tenant scoping and database conventions. This worked well, but as the codebase grew two problems emerged:

1. **The class facade added indirection without value.** Repository classes were thin wrappers — every public method forwarded directly to a standalone function with no added logic. The class existed to satisfy the pattern, not because OOP was the right tool.
2. **Large modules became unwieldy.** `InvoiceRepository` grew to the point where it had to be split into sub-modules (`invoice-queries.ts`, `invoice-mutations.ts`, etc.) that each accepted `prisma` as a parameter. The class was then a facade delegating to functions that already had the right shape. The facade was redundant.

The real enforcement goals from ADR-002 — tenant scoping, explicit naming, consistent conventions — are all achievable with plain async functions.

## Decision

New database access is written as plain async functions in `src/db/<domain>/`.

- Functions accept `prisma: PrismaClient` as their first argument (enabling test injection via `getTestPrisma()`).
- No class, no `BaseRepository`, no constructor.
- Naming stays explicit and entity-scoped: `findInvoiceById`, not `findById`.
- Every function includes `tenantId` in every `where` clause — same rule, different enforcement point.
- Files are split by concern: `queries.ts`, `mutations.ts`, `analytics.ts`, etc.

Existing repositories (`src/repositories/`) remain until they are explicitly migrated. No big-bang rewrite — each domain moves when there is a reason to touch it.

## Justification

- Functions are simpler than classes for stateless DB operations. No instantiation boilerplate, no `this.prisma`, no `protected get model()`.
- `prisma` as first arg is the natural dependency-injection seam for tests — same pattern as calling `getTestPrisma()` directly in integration tests.
- The conventions that ADR-002 actually cared about (tenant scope, explicit naming, no Prisma in actions) transfer cleanly. Nothing is lost.
- Incremental migration is safe — old and new can coexist while each domain moves at its own pace.

## Alternatives

- **Keep repository classes, split into sub-modules**: Already done for invoices (`InvoiceRepository` was a facade over sub-modules). Proved the class adds no value — we were already writing functions; the class just wrapped them.
- **Big-bang rewrite of all repositories at once**: High risk, no incremental value. Rejected in favour of domain-by-domain migration.
- **Service layer over repositories**: Mixing business logic with DB access concerns. Rejected — same reason as ADR-002.

## Consequences

- New entities get a `src/db/<domain>/` folder, not a `src/repositories/*-repository.ts` file.
- Actions import db functions directly: `import { findInvoiceById } from '@/db/invoices/queries'`.
- Integration tests call functions directly with `getTestPrisma()` as first arg — no repository instantiation in `beforeAll`.
- `BaseRepository` stays in `src/lib/` until all consumers are migrated, then can be deleted.
- ADR-002 conventions (tenant scope, explicit naming, no Prisma in actions) remain in force — the implementation changes, the rules do not.
- Test file location mirrors source: `src/db/invoices/__tests__/invoices.integration.ts`.

## Notes

Invoices were the first domain migrated (May 2026). The pattern was validated against 93 integration tests — all passed without logic changes.
