# Security & Quality Audit — May 2026

Audit of the full codebase. Findings grouped by severity. Check off items as resolved.

---

## CRITICAL

- [x] **C1 — Rate limiting disabled** ✓ 2026-05-14
  - File: `src/rate-limiter.ts`
  - Installed `@upstash/ratelimit` + `@upstash/redis`. Three limiters: 10 req/10m per IP for auth, 20 req/min per IP for uploads, 30 req/min per user ID for all private actions.
  - Wired into `withAuth`, `withTenant`, `withTenantPermission`. `updateSessionHeartbeat` exempted via `skipRateLimit`.
  - Disabled in development (`NODE_ENV !== 'development'` guard). Fails open when KV not configured.

- [x] **C2 — `switchActiveTenant` no DB validation** ✓ 2026-05-09
  - File: `src/actions/admin/switch-tenant.ts`
  - Validate tenant exists before setting cookie. Any string accepted today.

- [x] **C3 — File upload IDOR (no tenant check on `quoteId`)** ✓ 2026-05-09
  - File: `src/actions/files/mutations.ts`
  - Changed both `uploadFile` and `deleteFile` to `withTenantPermission('canManageQuotes')`.
  - Upload validates quoteId against the tenant when it's a real CUID.
  - File size checked against `MAX_FILE_SIZE` before reading into memory.
  - Note: s3Key ownership validation on delete requires a DB-level refactor (no universal tenantId on attachment records); tracked separately.

- [x] **C4 — Tasks use `withAuth` not `withTenantPermission`** ✓ 2026-05-09
  - Files: `src/actions/tasks/mutations.ts`, `src/actions/tasks/queries.ts`
  - Tasks are system-wide (no tenantId in schema). Changed all actions to `withSuperAdmin`. Removed manual role checks.

- [x] **C5 — Unscoped `findById` leaks existence across tenants** ✓ 2026-05-09
  - File: `src/actions/crm/customers/mutations.ts`
  - Replaced `customerRepo.findById(id)` with `customerRepo.findCustomerById(id, ctx.tenantId)` in `updateCustomer`.
  - All other `findById` calls in actions are either system-wide (tasks) or look up the current authenticated user — not IDOR risks.
  - Updated test mock accordingly.

---

## HIGH

- [x] **H1 — File size not validated before reading into memory** ✓ 2026-05-09 (fixed with C3)
  - File: `src/actions/files/mutations.ts`
  - Check `file.size > MAX_FILE_SIZE` before calling `arrayBuffer()`.

- [x] **H2 — `console.log` in Prisma query logger** ✓ 2026-05-09
  - File: `src/lib/prisma.ts:55–61`
  - Replaced with `logger.debug()`, consolidating query + params into single structured call.

- [x] **H3 — Soft-delete race condition (no transaction)** ✓ 2026-05-09
  - File: `src/repositories/invoice-repository.ts`
  - Wrapped `findUnique` + `update` in `$transaction`. Also improved error message to include id/tenantId context.

- [x] **H4 — Sequential awaits on independent operations** ✓ 2026-05-09
  - File: `src/actions/invitations/mutations.ts`
  - Already parallelised with `Promise.all`. Fixed related bug: `adminSendInvitation` was calling unscoped `tenantRepo.findById` instead of `tenantRepo.findTenantById`.

---

## MEDIUM

- [ ] **M1 — Files over 500 lines**
  - `src/repositories/quote-repository.ts` (2308L)
  - `src/repositories/invoice-repository.ts` (1687L)
  - `src/features/finances/quotes/hooks/use-quote-queries.ts` (1920L)
  - Split into read / write / special operation modules.

- [x] **M2 — `MAX_FILE_SIZE` imported but never applied** ✓ 2026-05-09 (fixed with C3)
  - File: `src/actions/files/mutations.ts`

- [x] **M3 — Missing JSDoc on repository methods** ✓ 2026-05-09
  - Added full JSDoc to all 7 methods in `invitation-repository.ts`.
  - Added missing `@param tenantId` to `customer-repository.ts` (4 methods) and `organization-repository.ts` (3 methods).

- [x] **M4 — Switch statements without `default` case** ✓ 2026-05-09
  - Added `default: break` to 3 stat-aggregation switches in `quote-repository.ts` and `invoice-repository.ts`.
  - Used `break` not `throw` — silently ignoring unknown statuses is correct for aggregation.

- [x] **M5 — Duplicate JSDoc block on `searchOrganisations`** ✓ 2026-05-09
  - File: `src/repositories/organization-repository.ts` — removed duplicate block.

---

## LOW

- [x] **L1 — `!!` used instead of `Boolean()`** ✓ 2026-05-09
  - Replaced all 23 instances across 15 files.

- [x] **L2 — Generic error messages without context** ✓ 2026-05-09
  - Added id/tenantId context to 8 throw sites in `quote-repository.ts`, `invoice-repository.ts`, and `task-execution-repository.ts`.

- [x] **L3 — No operation timeouts on long Prisma calls** ✓ 2026-05-09 (mitigated)
  - Task execution already has `Promise.race` timeout. Regular Prisma queries are covered by Neon connection timeouts and Vercel function-level timeouts. Per-query timeouts would be over-engineering.

---

## Test Coverage Gaps

- [ ] IDOR tests for file operations
- [ ] Cross-tenant data access attempt tests
- [ ] Rate limiting behaviour tests
- [ ] Soft-delete race condition tests
- [ ] Tenant isolation tests for task operations

---

## Progress Log

| Date       | Item            | Notes                                                                                     |
| ---------- | --------------- | ----------------------------------------------------------------------------------------- |
| 2026-05-09 | Audit completed | Initial findings documented                                                               |
| 2026-05-09 | C2 fixed        | `switchActiveTenant` now validates tenant exists via DB before setting cookie             |
| 2026-05-09 | C3 + H1 fixed   | File actions use `withTenantPermission`, quote ownership validated, file size enforced    |
| 2026-05-09 | C4 fixed        | Task mutations + queries changed to `withSuperAdmin`; removed manual role checks          |
| 2026-05-09 | H2 fixed        | `console.log` in Prisma query monitor replaced with `logger.debug`                        |
| 2026-05-09 | H3 fixed        | Invoice soft-delete wrapped in `$transaction` to prevent race condition                   |
| 2026-05-09 | H4 fixed        | Already parallel; fixed `tenantRepo.findById` → `findTenantById` in `adminSendInvitation` |
| 2026-05-09 | M2–M5 fixed     | JSDoc added, switch defaults added, duplicate comment removed, MAX_FILE_SIZE enforced     |
| 2026-05-09 | L1 fixed        | Replaced all 23 `!!` with `Boolean()` across 15 files                                     |
| 2026-05-09 | L2 fixed        | Added id/tenantId context to 8 generic error throws                                       |
| 2026-05-09 | L3 mitigated    | Task execution has timeout; Prisma covered by Neon + Vercel timeouts                      |
| 2026-05-09 | C5 fixed        | `updateCustomer` now uses tenant-scoped `findCustomerById`; test mock updated             |
