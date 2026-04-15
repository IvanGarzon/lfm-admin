# Testing

- Required for all new features: Vitest unit tests.
- Test structure: mirror app structure, `__tests__` next to components where applicable.
- Minimum coverage: expected behaviour + edge case + error handling.
- No obvious comments in tests — don't restate what the code does. The code should speak for itself.

## Repository Tests

Repository tests must run against the actual database — do not mock Prisma. All code that interacts with Prisma (i.e. all repositories) must be tested with real database calls.

## Test Factories (`src/lib/testing/factories/`)

- Every factory must export named **functions**, never `const` plain objects or arrow-function consts.
- Every input factory must accept an optional `overrides: Partial<XInput> = {}` parameter and spread it last.
- Never assign a factory as a bare reference: `const input = createXInput` (without calling it).
- **Integration tests**: call the factory fresh inside each `it` block — never at module level. Tests share real DB state, so a shared object risks cross-test contamination.
- **Unit/action tests**: a module-level `const baseInput = createXInput()` is acceptable — Prisma is mocked, there is no shared mutable state.

```ts
// correct — integration test, fresh call per test
const result = await repository.createEmployee(
  createEmployeeInput({ email: 'x@example.com' }),
  tenantId,
);

// correct — unit/action test, module-level const is fine
const baseInput = createCustomerInput();

// wrong — bare function reference (always)
const input = createEmployeeInput;
```

## Repository Integration Test Structure

- File: `src/repositories/__tests__/entity-repository.integration.ts`
- Use `setupTestDatabaseLifecycle()`, `getTestPrisma()`, `createTestTenant()` from `@/lib/testing/integration/database`.
- Create a fresh tenant in `beforeEach` — never share tenant state between tests.
- Group tests by method with `// -- methodName ---...` section headers (dash style to column 80).
- Every method group must cover: happy path, not-found/null case, tenant isolation.
