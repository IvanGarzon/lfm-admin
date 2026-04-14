# Code Style

## TypeScript Quality

- No type assertions. Never use `as any` or `as Type`. Use inference or type guards.
- No `eslint-disable` comments to work around type assertion lint rules. Fix the underlying type instead.
- No `any` type. If unsure, use `unknown` and add a type guard.
- No `null` for missing data. Use `undefined` instead of `null` for optional values.
- No `!` (non-null assertion). Use optional chaining (`?.`) or type guards instead.
- No `!!` (double negation). Use `Boolean()` or type guards instead.
- No `void` return types on functions. Use `Promise<void>` for async, `void` for sync only where genuinely needed.

## Logging

- No `console.log/error`. Use the `logger` helper instead. Always pass `{ context: 'descriptiveString', metadata: {} }` as the second argument.

## Naming

- `camelCase` functions
- `PascalCase` components and types
- `kebab-case` files
- Permission keys: `canReadX` / `canManageX`
- Action permission strings: `entity.actionName` (e.g. `invoices.createInvoice`) — both live in `src/lib/permissions.ts`

## Imports

Order: external packages → internal modules → types.

## Constants

Validation limits (name max length, search query max, per-page max, etc.) must be defined in `VALIDATION_LIMITS` in `src/lib/validation.ts` — never hardcode magic numbers.

## Concurrency

Prefer concurrent operations (`Promise.all`) over sequential when possible.

## File Size

Files over 500 lines must be split into modules.

## Comments

Section headers: `// -- Heading text ------...` (dash style to column 80, never `// ===`).

No emojis in code or docs unless explicitly requested.

## Language

Use Australian English throughout the codebase.

- Favour → not favor
- Colour → not color
- Organisation → not organization
- Enrolment → not enrollment
- Centre → not center
- Analyse → not analyze
