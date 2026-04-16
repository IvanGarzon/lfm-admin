# Las Flores Melbourne - Project Instructions for Claude

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Approach

- Be concise in output but thorough in reasoning.
- Prefer editing over rewriting whole files.
- Do not re-read files you have already read unless the file may have changed.
- Skip files over 100KB unless explicitly required.
- Suggest running /cost when a session is running long to monitor cache ratio.
- Recommend starting a new session when switching to an unrelated task.
- Test your code before declaring done.
- No sycophantic openers or closing fluff.
- User instructions always override this file.

Read `.claude/rules/` before starting:

- [`tooling.md`](.claude/rules/tooling.md) — Package manager (pnpm), tech stack
- [`api-conventions.md`](.claude/rules/api-conventions.md) — Data flow, hooks, actions, repositories, schemas, filters, types
- [`code-style.md`](.claude/rules/code-style.md) — TypeScript quality, naming, imports, comments, Australian English
- [`testing.md`](.claude/rules/testing.md) — Test structure, coverage, repository integration tests
- [`git.md`](.claude/rules/git.md) — Commit format, PR guidelines
- [`working-standards.md`](.claude/rules/working-standards.md) — Scope, problem solving, common mistakes

---

## Folder Structure

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
