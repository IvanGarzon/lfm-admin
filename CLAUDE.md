# Las Flores Melbourne - Project Instructions for Claude

**Tech stack**: React, Next.js, TypeScript, Prisma, PostgreSQL, pnpm, Vitest, Playwright, shadcn/ui, Tailwind CSS, Inggest.

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

## ⚠️ CRITICAL: NEVER USE npm OR npx

**This is non-negotiable. lfm-admin ONLY works with pnpm.**

lfm-admin uses pnpm with custom plugins that:

- Load `.services.env` with service discovery variables
- Configure the entire development environment
- Enable workspace features essential to the monorepo

**Using npm or npx will completely break the development environment.**

| ❌ NEVER USE              | ✅ ALWAYS USE              |
| ------------------------- | -------------------------- |
| `npm install`             | `pnpm` or `pnpm install`   |
| `npm run build`           | `pnpm build`               |
| `npm add package`         | `pnpm add package`         |
| `npx prisma migrate dev`  | `pnpm prisma migrate dev`  |
| `npx tsx scripts/seed.ts` | `pnpm tsx scripts/seed.ts` |
| `npx vitest`              | `pnpm vitest`              |
| `npx playwright test`     | `pnpm playwright test`     |
| `npx <any-command>`       | `pnpm <any-command>`       |

**Rule of thumb:** If you see `npm` or `npx` in a command, STOP immediately and convert it to `pnpm`.

---

## Critical Rules

### 1. Code quality standards

- **No type assertions.** Never use `as any` or `as Type`. Use inference or type guards. Ask if stuck.
- **Never use `eslint-disable` comments** to work around type assertion lint rules. Fix the underlying type instead. Ask if stuck.
- **No console.log/error.** Use `logger` helper instead.
- **No `any` type.** Never use `any`. If unsure, use `unknown` and add a type guard.
- **No `void` return types.** Functions must return `Promise<void>` when async and `void` when sync.
- **No `null` for missing data.** Use `undefined` instead of `null` for optional values.
- **No `!` (non-null assertion).** Use optional chaining (`?.`) or type guards instead.
- **No `!!` (double negation).** Use `Boolean()` or type guards instead.
- **No `!!` (double negation).** Use `Boolean()` or type guards instead.
- **Parallel over sequential.** Prefer concurrent operations when possible.
- **No obvious comments in tests** - Don't add comments that just restate what the code does (e.g. "// Import after mocking", "// Build a router from the procedures"). The code should speak for itself.

## Working Standards

### Style

- No emojis in code or docs unless requested
- Comment section headers: `// -- Heading text ------...` (dash style to column 80, never `// ===`)
- Brief PR descriptions -- no marketing copy
- Simple, factual descriptions -- no elaborate benefits/trade-offs sections

### Problem solving

- Don't jump to quick fixes -- understand root cause first
- Look at ALL related files, not just one
- Search for existing implementations before creating new ones
- Check git diff when writing PR descriptions
- When a solution fails, propose alternative approaches and ask the user how to proceed

### Scope

- Ask when ambiguous. Don't do more than requested.
- Verify work is complete: all instances updated, all deps added, duplicates eliminated.

### Most common mistakes

1. Over-engineering -- adding unnecessary complexity, helpers, abstractions
2. Wrong APIs -- always verify API names exist before using (e.g. `useFlag` not `useFeatureFlag`)
3. Incomplete work -- missing package.json deps, partial implementations, unchecked instances
4. Process violations -- not using structured tracing, reviewdog, or getting approval first
5. Type assertions -- use proper typing, never `as any`

## Git Commits

- Do NOT add "Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>" to commit messages
- Keep commit messages clean and standard

## Pull Requests

- Do NOT add "🤖 Generated with [Claude Code](https://claude.com/claude-code)" to PR descriptions
