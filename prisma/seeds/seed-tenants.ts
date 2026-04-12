import { prisma } from '@/lib/prisma';
import { faker } from '@faker-js/faker';
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'url';
import {
  AU_STATES,
  fakeAbn,
  fakeAuMobile,
  fakeBsb,
  capitalise,
  toSlug,
  parseArg,
} from './seed-helpers';

// -- Types -------------------------------------------------------------------

export type SeededTenant = {
  id: string;
  name: string;
  slug: string;
  adminEmail: string;
  managerEmail: string;
  password: string;
};

export type SeedTenantsOptions = {
  count?: number;
  password?: string;
};

// -- Helpers -----------------------------------------------------------------

/** Generates a florist-style business name with consistent capitalisation. */
function fakeBusinessName(): string {
  const styles = [
    () => `${faker.person.lastName()} Florals`,
    () => `${faker.location.city()} Flowers`,
    () => `The ${capitalise(faker.word.adjective({ strategy: 'closest' }))} Petal`,
    () => `${faker.person.firstName()}'s Floral Studio`,
    () => `Bloom & ${capitalise(faker.word.noun({ strategy: 'closest' }))}`,
    () => `${faker.location.city()} Bloom House`,
  ];
  return faker.helpers.arrayElement(styles)();
}

// -- Seed function -----------------------------------------------------------

/**
 * Seeds N tenants, each with realistic business settings and two users
 * (ADMIN and MANAGER). Returns the created tenant records including credentials
 * so downstream seed steps can reference tenant IDs.
 */
export async function seedTenants(options: SeedTenantsOptions = {}): Promise<SeededTenant[]> {
  const count = options.count ?? 3;
  const plainPassword = options.password ?? 'Password1!';
  const hashedPassword = await bcrypt.hash(plainPassword, 10);

  console.log(`🏢 Seeding ${count} tenant(s)...`);

  const seeded: SeededTenant[] = [];

  for (let i = 0; i < count; i++) {
    const name = fakeBusinessName();
    const slug = toSlug(name);
    const state = faker.helpers.arrayElement(AU_STATES);
    const city = faker.location.city();
    const adminEmail = `admin@${slug}.com.au`;
    const managerEmail = `manager@${slug}.com.au`;

    const tenant = await prisma.tenant.create({
      data: {
        name,
        slug,
        settings: {
          create: {
            abn: fakeAbn(),
            email: faker.internet.email({ firstName: name.split(' ')[0] }).toLowerCase(),
            phone: fakeAuMobile(),
            website: `https://www.${slug}.com.au`,
            address: faker.location.streetAddress(),
            city,
            state,
            postcode: faker.location.zipCode('####'),
            country: 'Australia',
            bankName: faker.helpers.arrayElement([
              'Commonwealth Bank',
              'ANZ',
              'Westpac',
              'NAB',
              'Bendigo Bank',
            ]),
            bsb: fakeBsb(),
            accountNumber: faker.string.numeric(9),
            accountName: name,
          },
        },
        users: {
          createMany: {
            data: [
              {
                firstName: faker.person.firstName(),
                lastName: faker.person.lastName(),
                email: adminEmail,
                password: hashedPassword,
                role: 'ADMIN',
              },
              {
                firstName: faker.person.firstName(),
                lastName: faker.person.lastName(),
                email: managerEmail,
                password: hashedPassword,
                role: 'MANAGER',
              },
            ],
          },
        },
      },
      select: { id: true, name: true, slug: true },
    });

    seeded.push({
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      adminEmail,
      managerEmail,
      password: plainPassword,
    });

    console.log(`   ✅ ${tenant.name} (slug: ${tenant.slug})`);
    console.log(`      admin:   ${adminEmail}`);
    console.log(`      manager: ${managerEmail}`);
    console.log(`      password: ${plainPassword}`);
  }

  console.log(`✅ Created ${seeded.length} tenant(s)`);
  return seeded;
}

// -- CLI entry point ---------------------------------------------------------

const isMain = process.argv[1] === fileURLToPath(import.meta.url);

if (isMain) {
  const count = parseInt(parseArg('count') ?? '3', 10);
  const password = parseArg('password');

  if (isNaN(count) || count < 1) {
    console.error('--count must be a positive integer');
    process.exit(1);
  }

  seedTenants({ count, password })
    .then(() => console.log('\nDone.'))
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}
