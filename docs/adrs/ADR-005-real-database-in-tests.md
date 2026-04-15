# ADR 005: Real Database in Repository Tests

Status: Accepted

## Context

The repository layer is the most critical boundary for tenant isolation. A mocked Prisma client can verify that the right method was called with the right arguments, but it cannot verify that `tenantId` scoping actually prevents cross-tenant data access — that only works against a real query planner.

Mocked Prisma tests also couple tests to implementation details (which Prisma method was called, in what order) rather than to behaviour (does this query return only the expected tenant's data).

## Decision

Repository tests run against the actual database. Prisma is never mocked.

- Tests use a real Neon PostgreSQL connection (or a local equivalent in CI).
- Each test seeds its own data and cleans up after itself.
- Tenant isolation is tested by seeding data for two tenants and asserting that queries for one tenant do not return data from the other.

## Justification

- Tenant isolation is a correctness guarantee, not a code review concern. A real DB test can fail on a missing `tenantId` where clause; a mock cannot.
- Prisma query behaviour (e.g. `findFirst` vs `findUnique` scoping) is only meaningful against a real query engine.
- Tests that reflect real behaviour catch real bugs. Mocked tests catch that you called the mock correctly.

## Alternatives

- **Mock Prisma with `jest-mock-extended` or similar**: Fast, no DB required. Cannot test actual query correctness or tenant isolation. Rejected.
- **In-memory SQLite via Prisma**: Closer to real, but SQLite has different constraint and type behaviour to PostgreSQL. Not representative enough. Rejected.
- **Integration tests only at the action layer**: Actions don't call Prisma — repositories do. Testing at the action layer would require more setup for less precision. Rejected.

## Consequences

- Repository tests require a database connection. CI must have access to a test database.
- Tests must isolate their own data — no shared fixtures that persist between runs.
- Test speed is slower than mocked unit tests. This is acceptable given the correctness guarantees provided.
