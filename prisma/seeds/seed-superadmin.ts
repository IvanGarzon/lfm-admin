import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'url';

/**
 * Seed Super Admin User
 * Creates a global SUPERADMIN user not linked to any tenant.
 * Credentials are read from SUPERADMIN_EMAIL and SUPERADMIN_PASSWORD env vars.
 * Safe to run repeatedly — updates password/email if already exists.
 */
export async function seedSuperAdmin() {
  const email = process.env.SUPERADMIN_EMAIL ?? 'admin@lfm.com.au';
  const password = process.env.SUPERADMIN_PASSWORD ?? 'SuperAdmin123!';

  const existing = await prisma.user.findUnique({ where: { email } });

  if (!existing) {
    await prisma.user.create({
      data: {
        firstName: 'System',
        lastName: 'Administrator',
        email,
        password: await bcrypt.hash(password, 10),
        role: 'SUPER_ADMIN',
        tenantId: null, // Super admins are not linked to any tenant
      },
    });
    console.log(`   Created super admin user: ${email}`);
  } else {
    await prisma.user.update({
      where: { id: existing.id },
      data: {
        email,
        role: 'SUPER_ADMIN',
        tenantId: null,
        password: await bcrypt.hash(password, 10),
      },
    });
    console.log(`   Updated super admin user: ${email}`);
  }
}

// Allow running directly: pnpm tsx --env-file=.env prisma/seeds/seed-superadmin.ts
const isMain = process.argv[1] === fileURLToPath(import.meta.url);
if (isMain) {
  seedSuperAdmin()
    .then(() => console.log('Done'))
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}
