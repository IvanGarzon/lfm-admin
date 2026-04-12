import { prisma } from '@/lib/prisma';
import { faker } from '@faker-js/faker';
import { fileURLToPath } from 'url';
import type { SeededTenant } from './seed-tenants';
import { fakeAuPhone, batchAll } from './seed-helpers';

// -- Types -------------------------------------------------------------------

export type SeedCustomersOptions = {
  tenants: SeededTenant[];
  countPerTenant?: number;
};

// -- Seed function -----------------------------------------------------------

/**
 * Seeds customers for each supplied tenant. Customers are linked to
 * organisations within the same tenant (30% probability). Each tenant gets
 * its own isolated set of customer records.
 * @param options - The tenants to seed for and optional count per tenant.
 * @returns The total number of customers created across all tenants.
 */
export async function seedCustomers(options: SeedCustomersOptions): Promise<number> {
  const { tenants, countPerTenant = 50 } = options;

  console.log(`\n👥 Seeding customers for ${tenants.length} tenant(s)...`);

  let total = 0;

  for (const tenant of tenants) {
    const organisations = await prisma.organization.findMany({
      where: { tenantId: tenant.id },
      select: { id: true },
    });

    const fns = Array.from({ length: countPerTenant }, () => async () => {
      const genderValue = faker.helpers.arrayElement(['MALE', 'FEMALE'] as const);
      const firstName = faker.person.firstName(genderValue === 'MALE' ? 'male' : 'female');
      const lastName = faker.person.lastName();
      const email = faker.internet.email({ firstName, lastName }).toLowerCase();

      const hasOrganisation = faker.datatype.boolean({ probability: 0.3 });
      const organisationId =
        hasOrganisation && organisations.length > 0
          ? faker.helpers.arrayElement(organisations).id
          : null;

      return prisma.customer.create({
        data: {
          tenantId: tenant.id,
          firstName,
          lastName,
          email,
          gender: genderValue,
          phone: faker.helpers.maybe(() => fakeAuPhone(), { probability: 0.8 }) ?? null,
          status: 'ACTIVE',
          organizationId: organisationId,
          useOrganizationAddress: Boolean(organisationId),
          address1: organisationId ? null : faker.location.streetAddress(),
          city: organisationId ? null : faker.location.city(),
          postalCode: organisationId ? null : faker.location.zipCode('####'),
          country: organisationId ? null : 'Australia',
        },
        select: { id: true },
      });
    });

    const { results, failed } = await batchAll(fns);
    const created = results.length;
    total += created;

    const suffix = failed > 0 ? ` (${failed} skipped — duplicate emails)` : '';
    console.log(`   ✅ ${tenant.name}: ${created} customers${suffix}`);
  }

  console.log(`✅ Created ${total} customer(s) across ${tenants.length} tenant(s)`);
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

    const seededTenants = tenants.map((tenant) => ({
      ...tenant,
      adminEmail: '',
      managerEmail: '',
      password: '',
    }));

    await seedCustomers({ tenants: seededTenants });
    console.log('\nDone.');
  })()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}
