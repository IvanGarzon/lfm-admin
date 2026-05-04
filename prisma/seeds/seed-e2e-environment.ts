/** Creates a fresh E2E test environment for each test run.
 *
 * - Removes any stale e2e tenant + user left over from an interrupted run.
 * - Creates a new tenant with settings.
 * - Creates a new MANAGER user with credentials from E2E_EMAIL / E2E_PASSWORD.
 *
 * Must run BEFORE global-setup attempts to log in so the user exists.
 */

import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'url';
import { deleteTenantData } from './teardown-e2e-environment';
import { env } from '@/env';

const name = env.E2E_TENANT;
const slug = env.E2E_SLUG;
const email = env.E2E_EMAIL;
const password = env.E2E_PASSWORD;

export async function seedE2EEnvironment(): Promise<void> {
  if (!slug || !name || !email || !password) {
    throw new Error('E2E_SLUG and E2E_PASSWORD must be set in .env before running e2e tests');
  }

  // -- Remove stale environment from any previous interrupted run ------------

  const stale = await prisma.tenant.findUnique({ where: { slug } });

  if (stale) {
    await deleteTenantData(stale.id);
    await prisma.tenant.delete({ where: { id: stale.id } });
    console.log('   Removed stale e2e tenant');
  }

  // Guard: remove any orphaned e2e user left if teardown was interrupted.
  const staleUser = await prisma.user.findUnique({ where: { email } });
  if (staleUser) {
    await prisma.user.delete({ where: { id: staleUser.id } });
    console.log('   Removed stale e2e user');
  }

  // -- Create fresh tenant ---------------------------------------------------
  const tenant = await prisma.tenant.create({
    data: {
      name,
      slug,
      settings: { create: {} }
    }
  });

  console.log(`   Created e2e tenant: ${tenant.name}`);

  // -- Create fresh user scoped to tenant ------------------------------------

  await prisma.user.create({
    data: {
      firstName: 'E2E',
      lastName: 'Test',
      email,
      password: await bcrypt.hash(password, 10),
      role: 'ADMIN',
      tenantId: tenant.id
    }
  });

  console.log(`   Created e2e user: ${email}`);
}

// Allow running directly: pnpm tsx --env-file=.env prisma/seeds/seed-e2e-environment.ts
const isMain = process.argv[1] === fileURLToPath(import.meta.url);
if (isMain) {
  seedE2EEnvironment()
    .then(() => console.log('Done'))
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}
