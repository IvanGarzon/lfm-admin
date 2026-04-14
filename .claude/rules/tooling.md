# Tooling

## Package Manager

**Never use `npm` or `npx`. Always use `pnpm`.**

lfm-admin uses pnpm with custom plugins that configure the entire development environment. Using npm or npx will break the environment.

| Never                     | Always                     |
| ------------------------- | -------------------------- |
| `npm install`             | `pnpm install`             |
| `npm run build`           | `pnpm build`               |
| `npm add package`         | `pnpm add package`         |
| `npx prisma migrate dev`  | `pnpm prisma migrate dev`  |
| `npx tsx scripts/seed.ts` | `pnpm tsx scripts/seed.ts` |
| `npx vitest`              | `pnpm vitest`              |
| `npx playwright test`     | `pnpm playwright test`     |

## Tech Stack

- **Frontend**: Next.js, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Prisma ORM
- **Database**: Neon PostgreSQL
- **Auth**: NextAuth
- **Tests**: Vitest, Playwright
- **Jobs**: Inngest
- **Package manager**: pnpm
