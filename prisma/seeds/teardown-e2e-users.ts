/**
 * Removes seed users from the E2E tenant before re-seeding.
 * Only deletes the known seed emails — the authenticated E2E admin is untouched.
 */

import { prisma } from '@/lib/prisma';
import { fileURLToPath } from 'url';
import { env } from '@/env';
import { E2E_SEED_USERS } from './seed-e2e-users';

export async function teardownE2EUsers(): Promise<void> {
  const slug = env.E2E_SLUG;

  if (!slug) {
    throw new Error('E2E_SLUG must be set in .env before running e2e tests');
  }

  const tenant = await prisma.tenant.findUnique({ where: { slug } });

  if (!tenant) {
    return;
  }

  const emails = E2E_SEED_USERS.map((u) => u.email);

  await prisma.user.deleteMany({
    where: { email: { in: emails }, tenantId: tenant.id }
  });

  console.log('   Removed E2E seed users');
}

const isMain = process.argv[1] === fileURLToPath(import.meta.url);
if (isMain) {
  teardownE2EUsers()
    .then(() => console.log('Done'))
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}
