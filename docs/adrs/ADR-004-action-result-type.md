# ADR 004: ActionResult<T> as the Uniform Action Return Type

Status: Accepted

## Context

Server actions can fail in many ways: auth failure, validation error, Prisma constraint violation, unexpected exception. Without a contract, each action handled failures differently — some threw, some returned `null`, some returned a mix of shapes. The UI had no reliable way to know what to expect.

Throwing errors across the server/client boundary in Next.js also has constraints: only serialisable values cross the boundary, and unhandled throws surface as generic errors in production.

## Decision

Every server action returns `ActionResult<T>`, never raw data, never a thrown error.

```ts
type ActionResult<T> =
  | { success: true; data: T; message?: string }
  | {
      success: false;
      error: string;
      code?: ErrorCode;
      errors?: Record<string, string[]>;
      context?: Record<string, unknown>;
    };
```

All action logic is wrapped in `try/catch`. The catch block always calls `handleActionError(error, 'fallback message')` from `@/lib/error-handler`, which normalises Zod errors, Prisma errors, AppErrors, and unknown errors into the `ActionResult` shape.

## Justification

- The UI always has a discriminated union to work with. `if (result.success)` is the only pattern needed — no try/catch in components, no null checks.
- `handleActionError` centralises Prisma error code mapping (P2002 → "already exists", P2025 → "not found", etc.) and Zod validation message extraction. This doesn't need to be repeated per action.
- Field-level validation errors (`errors: Record<string, string[]>`) map directly to form state without extra transformation.
- `code?: ErrorCode` gives the client a machine-readable error type when it needs to branch on specific failures.

## Alternatives

- **Throw and catch at the component level**: Breaks the serialisation boundary in Next.js. Error detail is lost in production. Rejected.
- **Return `null` for failures**: No error information reaches the UI. Rejected.
- **Per-action error shapes**: Inconsistent. UI code has to handle different shapes per action. Rejected.

## Consequences

- Actions must never `throw` or return raw data. Violations break the UI's ability to distinguish success from failure.
- `handleActionError` must be kept up to date with new Prisma error codes as they're encountered.
- Hooks that call actions must check `result.success` before accessing `result.data`.
