import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'url';

/**
 * One-time bootstrap: creates the E2E auth user without a tenant.
 * Tenant assignment happens per test run in seed-e2e-environment.ts.
 * Safe to run repeatedly — updates password if user already exists.
 */
export async function seedE2EUser() {
  const email = process.env.E2E_EMAIL;
  const password = process.env.E2E_PASSWORD;

  if (!email || !password) {
    console.log('   ⚠️  E2E_EMAIL or E2E_PASSWORD not set — skipping e2e user seed');
    return;
  }

  const existing = await prisma.user.findUnique({ where: { email } });

  if (!existing) {
    await prisma.user.create({
      data: {
        firstName: 'E2E',
        lastName: 'Test',
        email,
        password: await bcrypt.hash(password, 10),
        role: 'MANAGER'
        // tenantId intentionally omitted — assigned per run by seed-e2e-environment.ts
      }
    });
    console.log(`   Created e2e user: ${email}`);
  } else {
    // Keep password in sync with .env in case it changed.
    await prisma.user.update({
      where: { id: existing.id },
      data: { password: await bcrypt.hash(password, 10) }
    });
    console.log(`   Updated e2e user password: ${email}`);
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
