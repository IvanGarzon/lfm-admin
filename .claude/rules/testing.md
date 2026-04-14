# Testing

- Required for all new features: Vitest unit tests.
- Test structure: mirror app structure, `__tests__` next to components where applicable.
- Minimum coverage: expected behaviour + edge case + error handling.
- No obvious comments in tests — don't restate what the code does. The code should speak for itself.

## Repository Tests

Repository tests must run against the actual database — do not mock Prisma. All code that interacts with Prisma (i.e. all repositories) must be tested with real database calls.
