import { prisma } from '@/lib/prisma';
import { faker } from '@faker-js/faker';
import { fileURLToPath } from 'url';
import type { SeededTenant } from './seed-tenants';
import { fakeAuMobile, batchAll } from './seed-helpers';

// -- Types -------------------------------------------------------------------

export type SeedEmployeesOptions = {
  tenants: SeededTenant[];
  countPerTenant?: number;
};

// -- Seed function -----------------------------------------------------------

/**
 * Seeds employees for each supplied tenant. Each tenant receives its own
 * independent set of employee records.
 * @param options - The tenants to seed for and optional count per tenant.
 * @returns The total number of employees created across all tenants.
 */
export async function seedEmployees(options: SeedEmployeesOptions): Promise<number> {
  const { tenants, countPerTenant = 20 } = options;

  console.log(`\n👷 Seeding employees for ${tenants.length} tenant(s)...`);

  let total = 0;

  for (const tenant of tenants) {
    const fns = Array.from({ length: countPerTenant }, () => async () => {
      const genderValue = faker.helpers.arrayElement(['MALE', 'FEMALE'] as const);
      const firstName = faker.person.firstName(genderValue === 'MALE' ? 'male' : 'female');
      const lastName = faker.person.lastName();
      const email = faker.internet.email({ firstName, lastName }).toLowerCase();

      return prisma.employee.create({
        data: {
          firstName,
          lastName,
          email,
          phone: fakeAuMobile(),
          gender: genderValue,
          dob: faker.date.birthdate({ min: 18, max: 65, mode: 'age' }),
          rate: faker.number.float({ min: 25, max: 150, multipleOf: 0.25 }),
          status: faker.helpers.weightedArrayElement([
            { value: 'ACTIVE' as const, weight: 0.85 },
            { value: 'INACTIVE' as const, weight: 0.15 },
          ]),
          avatarUrl:
            faker.helpers.maybe(
              () =>
                `https://api.slingacademy.com/public/sample-users/${faker.number.int({ min: 1, max: 100 })}.png`,
              { probability: 0.7 },
            ) ?? null,
          tenantId: tenant.id,
        },
        select: { id: true },
      });
    });

    const { results, failed } = await batchAll(fns);
    const created = results.length;
    total += created;

    const suffix = failed > 0 ? ` (${failed} skipped — duplicate emails)` : '';
    console.log(`   ✅ ${tenant.name}: ${created} employees${suffix}`);
  }

  console.log(`✅ Created ${total} employee(s) across ${tenants.length} tenant(s)`);
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

    await seedEmployees({ tenants: seededTenants });
    console.log('\nDone.');
  })()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}
