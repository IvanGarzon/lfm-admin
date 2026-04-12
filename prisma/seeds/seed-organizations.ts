import { prisma } from '@/lib/prisma';
import { faker } from '@faker-js/faker';
import { fileURLToPath } from 'url';
import type { SeededTenant } from './seed-tenants';
import { AU_STATES, fakeAbn, fakeAuMobile } from './seed-helpers';

// -- Types -------------------------------------------------------------------

export type SeedOrganizationsOptions = {
  tenants: SeededTenant[];
  countPerTenant?: number;
};

// -- Helpers -----------------------------------------------------------------

const ORG_TYPES = [
  () => `${faker.location.city()} Events & Weddings`,
  () => `${faker.company.name()} Hospitality Group`,
  () => `${faker.location.city()} Convention Centre`,
  () => `${faker.company.name()} Hotels`,
  () => `${faker.location.city()} Botanical Gardens`,
  () => `${faker.company.name()} Floral Design Studio`,
  () => `${faker.company.name()} Funeral Services`,
  () => `${faker.location.city()} Corporate Events`,
] as const;

function buildOrganisation() {
  const state = faker.helpers.arrayElement(AU_STATES);
  const name = faker.helpers.arrayElement(ORG_TYPES)();

  return {
    name,
    address: faker.location.streetAddress(),
    city: faker.location.city(),
    state,
    postcode: faker.location.zipCode('####'),
    country: 'Australia' as const,
    phone: fakeAuMobile(),
    email: faker.internet
      .email({ firstName: name.split(' ')[0], lastName: name.split(' ')[1] ?? '' })
      .toLowerCase(),
    website: faker.helpers.maybe(
      () =>
        `https://www.${name
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '-')
          .replace(/-+/g, '-')}.com.au`,
      { probability: 0.6 },
    ),
    abn: faker.helpers.maybe(() => fakeAbn(), { probability: 0.7 }),
    status: 'ACTIVE' as const,
  };
}

// -- Seed function -----------------------------------------------------------

/**
 * Seeds client organisations for each supplied tenant. Each tenant gets its
 * own independent set of organisations so data remains properly isolated.
 * @param options - The tenants to seed for and optional count per tenant.
 * @returns The total number of organisations created across all tenants.
 */
export async function seedOrganizations(options: SeedOrganizationsOptions): Promise<number> {
  const { tenants, countPerTenant = 10 } = options;

  console.log(`\n🏢 Seeding organisations for ${tenants.length} tenant(s)...`);

  let total = 0;

  for (const tenant of tenants) {
    const organizations = Array.from({ length: countPerTenant }, () => buildOrganisation());

    const creates = organizations.map((org) =>
      prisma.organization.create({
        data: {
          ...org,
          tenantId: tenant.id,
        },
      }),
    );

    await Promise.all(creates);
    total += countPerTenant;
    console.log(`   ✅ ${tenant.name}: ${countPerTenant} organisations`);
  }

  console.log(`✅ Created ${total} organisation(s) across ${tenants.length} tenant(s)`);
  return total;
}

// -- CLI entry point ---------------------------------------------------------

const isMain = process.argv[1] === fileURLToPath(import.meta.url);

if (isMain) {
  (async () => {
    const tenants = await prisma.tenant.findMany({ select: { id: true, name: true, slug: true } });

    if (tenants.length === 0) {
      console.error('No tenants found. Run seed-tenants.ts first.');
      process.exit(1);
    }

    // SeededTenant requires adminEmail, managerEmail, password — use placeholder values
    // since they are only needed for downstream seeds, not for organisation seeding itself.
    const seededTenants = tenants.map((tenant) => ({
      ...tenant,
      adminEmail: '',
      managerEmail: '',
      password: '',
    }));

    await seedOrganizations({ tenants: seededTenants });
    console.log('\nDone.');
  })()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}
