import { prisma } from '../../src/lib/prisma';
import { Gender, CustomerStatus } from '../generated/client/index.js';
import { faker } from '@faker-js/faker';

/**
 * Seed Customers
 * Creates customer records with optional organization links
 */

async function seedCustomers() {
  console.log('👥 Seeding customers...');

  // Get existing organizations
  const organizations = await prisma.organization.findMany();

  const customers = [];

  // Create 50 customers
  for (let i = 0; i < 50; i++) {
    const gender = faker.helpers.arrayElement(['MALE', 'FEMALE'] as Gender[]);
    const firstName = faker.person.firstName(gender === 'MALE' ? 'male' : 'female');
    const lastName = faker.person.lastName();
    const email = faker.internet.email({ firstName, lastName }).toLowerCase();

    // 30% of customers belong to an organization
    const hasOrganization = faker.datatype.boolean({ probability: 0.3 });
    const organizationId = hasOrganization && organizations.length > 0
      ? faker.helpers.arrayElement(organizations).id
      : null;

    const customer = {
      firstName,
      lastName,
      gender,
      email,
      phone: faker.helpers.maybe(
        () => {
          // Australian phone numbers
          const mobile = faker.helpers.arrayElement([
            `04${faker.string.numeric(8)}`,
            `+614${faker.string.numeric(8)}`,
          ]);
          return mobile;
        },
        { probability: 0.8 },
      ),
      status: faker.helpers.weightedArrayElement([
        { value: 'ACTIVE' as CustomerStatus, weight: 0.9 },
        { value: 'INACTIVE' as CustomerStatus, weight: 0.1 },
      ]),
      organizationId,
    };

    customers.push(customer);
  }

  // Bulk create customers
  let created = 0;
  for (const customer of customers) {
    try {
      await prisma.customer.create({
        data: customer,
      });
      created++;
    } catch (error) {
      // Skip duplicates
      console.log(`⚠️  Skipped duplicate email: ${customer.email}`);
    }
  }

  console.log(`✅ Created ${created} customers`);
}

async function main() {
  try {
    await seedCustomers();
    console.log('🎉 Customer seeding completed!');
  } catch (error) {
    console.error('❌ Error seeding customers:', error);
    throw error;
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
