import { prisma } from '@/lib/prisma';
import { Gender, CustomerStatus } from '@/prisma/client';
import { faker } from '@faker-js/faker';

interface Customer {
  firstName: string;
  lastName: string;
  gender: Gender;
  email: string;
  phone: string | null;
  status: CustomerStatus;
  organizationId: string | null;
}

/**
 * Seed Customers
 * Creates customer records with optional organization links
 */

export async function seedCustomers() {
  console.log('👥 Seeding customers...');

  // Get existing organizations
  const organizations = await prisma.organization.findMany();
  const customers: Customer[] = [];

  // Create 50 customers
  for (let i = 0; i < 50; i++) {
    const gender = faker.helpers.arrayElement(['MALE', 'FEMALE']);
    const firstName = faker.person.firstName(gender === 'MALE' ? 'male' : 'female');
    const lastName = faker.person.lastName();
    const email = faker.internet.email({ firstName, lastName }).toLowerCase();

    // 30% of customers belong to an organization
    const hasOrganization = faker.datatype.boolean({ probability: 0.3 });
    const organizationId =
      hasOrganization && organizations.length > 0
        ? faker.helpers.arrayElement(organizations).id
        : null;

    const customer: Customer = {
      firstName,
      lastName,
      gender,
      email,
      phone:
        faker.helpers.maybe(
          () => {
            // Australian phone numbers
            const mobile = faker.helpers.arrayElement([
              `04${faker.string.numeric(8)}`,
              `+614${faker.string.numeric(8)}`,
            ]);

            return mobile;
          },
          { probability: 0.8 },
        ) ?? null,
      status: faker.helpers.weightedArrayElement([
        { value: 'ACTIVE', weight: 0.9 },
        { value: 'INACTIVE', weight: 0.1 },
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
