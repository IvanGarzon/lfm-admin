import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'url';

const TEST_TENANT_SLUG = 'e2e-test-tenant';
const TEST_ORG_NAME = 'E2E Test Organisation';

/**
 * Seed E2E Test User
 * Creates a tenant and MANAGER user for Playwright e2e tests.
 * Credentials are read from E2E_EMAIL and E2E_PASSWORD env vars.
 * Safe to run repeatedly — skips creation if already exists.
 */
export async function seedE2EUser() {
  const email = process.env.E2E_EMAIL;
  const password = process.env.E2E_PASSWORD;

  if (!email || !password) {
    console.log('   ⚠️  E2E_EMAIL or E2E_PASSWORD not set — skipping e2e user seed');
    return;
  }

  // -- Tenant ----------------------------------------------------------------

  let tenant = await prisma.tenant.findUnique({ where: { slug: TEST_TENANT_SLUG } });

  if (!tenant) {
    tenant = await prisma.tenant.create({
      data: { name: 'E2E Test Tenant', slug: TEST_TENANT_SLUG, settings: { create: {} } },
    });
    console.log(`   Created tenant: ${tenant.name}`);
  }

  // -- Organisation ----------------------------------------------------------

  const existingOrg = await prisma.organization.findFirst({
    where: { name: TEST_ORG_NAME, tenantId: tenant.id },
  });

  if (!existingOrg) {
    await prisma.organization.create({
      data: { name: TEST_ORG_NAME, tenantId: tenant.id },
    });
    console.log(`   Created organisation: ${TEST_ORG_NAME}`);
  }

  // -- User ------------------------------------------------------------------

  const existing = await prisma.user.findUnique({ where: { email } });

  if (!existing) {
    await prisma.user.create({
      data: {
        firstName: 'E2E',
        lastName: 'Test',
        email,
        password: await bcrypt.hash(password, 10),
        role: 'MANAGER',
        tenantId: tenant.id,
      },
    });
    console.log(`   Created e2e user: ${email}`);
  } else {
    await prisma.user.update({
      where: { id: existing.id },
      data: {
        tenantId: existing.tenantId ?? tenant.id,
        role: 'MANAGER',
        password: await bcrypt.hash(password, 10),
      },
    });
    console.log(`   Updated e2e user: ${email}`);
  }
}

// Allow running directly: pnpm tsx --env-file=.env prisma/seeds/seed-e2e-user.ts
const isMain = process.argv[1] === fileURLToPath(import.meta.url);
if (isMain) {
  seedE2EUser()
    .then(() => console.log('Done'))
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}
