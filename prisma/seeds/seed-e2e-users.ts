/**
 * Seeds deterministic user test data for the E2E tenant.
 * Creates known staff users so the users list page has predictable rows.
 *
 * Call teardownE2EUsers() before seedE2EUsers() in beforeAll to ensure a
 * clean slate regardless of what previous test runs created via the UI.
 */

import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'url';
import { prisma } from '@/lib/prisma';
import { env } from '@/env';

export const E2E_SEED_USERS = [
  {
    firstName: 'Carol',
    lastName: 'Seed',
    email: 'carol.seed@e2e.test',
    role: 'USER' as const
  }
];

export async function seedE2EUsers(): Promise<void> {
  const slug = env.E2E_SLUG;
  const password = env.E2E_PASSWORD;

  if (!slug || !password) {
    throw new Error('E2E_SLUG and E2E_PASSWORD must be set in .env before running e2e tests');
  }

  const tenant = await prisma.tenant.findUnique({ where: { slug } });

  if (!tenant) {
    console.log('   E2E tenant not found — run seed-e2e-environment.ts first');
    return;
  }

  // Guard: remove any orphaned seed users left by an interrupted or mis-configured
  // previous run (e.g. old teardown that used the wrong tenant slug).
  await prisma.user.deleteMany({
    where: { email: { in: E2E_SEED_USERS.map((u) => u.email) } }
  });

  const hashedPassword = await bcrypt.hash(password, 10);
  for (const user of E2E_SEED_USERS) {
    await prisma.user.create({
      data: {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        password: hashedPassword,
        role: user.role,
        tenantId: tenant.id
      }
    });
    console.log(`Created E2E seed user: ${user.firstName} ${user.lastName}`);
  }
}

// Allow running directly: pnpm tsx --env-file=.env prisma/seeds/seed-e2e-users.ts
const isMain = process.argv[1] === fileURLToPath(import.meta.url);
if (isMain) {
  seedE2EUsers()
    .then(() => console.log('Done'))
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}
