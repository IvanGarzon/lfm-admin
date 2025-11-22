import { PrismaClient, Gender, CustomerStatus, ProductStatus, States } from '@/prisma/client';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

/**
 * Comprehensive Seed Script
 * Seeds: Organizations, Customers, and Products
 */

async function seedOrganizations() {
  console.log('🏢 Seeding organizations...');

  const organizations = [
    {
      name: 'Tech Innovations Pty Ltd',
      address: '123 Tech Street',
      city: 'Melbourne',
      state: 'VIC' as States,
      postcode: '3000',
      country: 'Australia',
    },
    {
      name: 'Green Energy Solutions',
      address: '456 Sustainability Ave',
      city: 'Sydney',
      state: 'NSW' as States,
      postcode: '2000',
      country: 'Australia',
    },
    {
      name: 'Digital Marketing Group',
      address: '789 Creative Lane',
      city: 'Brisbane',
      state: 'QLD' as States,
      postcode: '4000',
      country: 'Australia',
    },
    {
      name: 'Healthcare Plus',
      address: '321 Medical Drive',
      city: 'Perth',
      state: 'WA' as States,
      postcode: '6000',
      country: 'Australia',
    },
    {
      name: 'Education First Academy',
      address: '654 Learning Way',
      city: 'Adelaide',
      state: 'SA' as States,
      postcode: '5000',
      country: 'Australia',
    },
    {
      name: 'Construction Experts Ltd',
      address: '987 Builder Road',
      city: 'Hobart',
      state: 'TAS' as States,
      postcode: '7000',
      country: 'Australia',
    },
    {
      name: 'Financial Services Group',
      address: '147 Money Street',
      city: 'Canberra',
      state: 'ACT' as States,
      postcode: '2600',
      country: 'Australia',
    },
    {
      name: 'Retail Dynamics',
      address: '258 Shopping Plaza',
      city: 'Darwin',
      state: 'NT' as States,
      postcode: '0800',
      country: 'Australia',
    },
  ];

  const createdOrganizations = [];
  for (const org of organizations) {
    const created = await prisma.organization.create({
      data: org,
    });
    createdOrganizations.push(created);
  }

  console.log(`✅ Created ${createdOrganizations.length} organizations`);
  return createdOrganizations;
}

async function seedCustomers(organizations: { id: string }[]) {
  console.log('👥 Seeding customers...');

  const customers = [];

  // Create 50 customers
  for (let i = 0; i < 50; i++) {
    const gender = faker.helpers.arrayElement(['MALE', 'FEMALE'] as Gender[]);
    const firstName = faker.person.firstName(gender === 'MALE' ? 'male' : 'female');
    const lastName = faker.person.lastName();
    const email = faker.internet.email({ firstName, lastName }).toLowerCase();

    // 30% of customers belong to an organization
    const hasOrganization = faker.datatype.boolean({ probability: 0.3 });
    const organizationId = hasOrganization ? faker.helpers.arrayElement(organizations).id : null;

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

async function seedProducts() {
  console.log('📦 Seeding products...');

  const productCategories = [
    // Services
    {
      name: 'Web Development',
      price: () => faker.number.float({ min: 5000, max: 20000, multipleOf: 100 }),
      isService: true,
    },
    {
      name: 'Mobile App Development',
      price: () => faker.number.float({ min: 8000, max: 30000, multipleOf: 100 }),
      isService: true,
    },
    {
      name: 'UI/UX Design',
      price: () => faker.number.float({ min: 3000, max: 10000, multipleOf: 100 }),
      isService: true,
    },
    {
      name: 'SEO Optimization',
      price: () => faker.number.float({ min: 2000, max: 8000, multipleOf: 100 }),
      isService: true,
    },
    {
      name: 'Digital Marketing Campaign',
      price: () => faker.number.float({ min: 5000, max: 15000, multipleOf: 100 }),
      isService: true,
    },
    {
      name: 'Consulting Services',
      price: () => faker.number.float({ min: 2500, max: 12000, multipleOf: 100 }),
      isService: true,
    },
    {
      name: 'Cloud Infrastructure Setup',
      price: () => faker.number.float({ min: 4000, max: 15000, multipleOf: 100 }),
      isService: true,
    },
    {
      name: 'Database Optimization',
      price: () => faker.number.float({ min: 2000, max: 8000, multipleOf: 100 }),
      isService: true,
    },
    {
      name: 'Security Audit',
      price: () => faker.number.float({ min: 3000, max: 12000, multipleOf: 100 }),
      isService: true,
    },
    {
      name: 'API Integration',
      price: () => faker.number.float({ min: 2800, max: 10000, multipleOf: 100 }),
      isService: true,
    },

    // Products
    {
      name: 'Premium Software License',
      price: () => faker.number.float({ min: 500, max: 5000, multipleOf: 50 }),
      isService: false,
    },
    {
      name: 'Hardware Equipment',
      price: () => faker.number.float({ min: 1000, max: 8000, multipleOf: 100 }),
      isService: false,
    },
    {
      name: 'Training Materials',
      price: () => faker.number.float({ min: 200, max: 2000, multipleOf: 50 }),
      isService: false,
    },
    {
      name: 'Support Package',
      price: () => faker.number.float({ min: 1000, max: 5000, multipleOf: 100 }),
      isService: false,
    },
    {
      name: 'Maintenance Contract',
      price: () => faker.number.float({ min: 2000, max: 10000, multipleOf: 100 }),
      isService: false,
    },
  ];

  const products = [];

  for (const category of productCategories) {
    // Create 2-3 variations of each category
    const variations = faker.number.int({ min: 2, max: 3 });

    for (let i = 0; i < variations; i++) {
      const name =
        i === 0
          ? category.name
          : `${category.name} - ${faker.helpers.arrayElement(['Basic', 'Standard', 'Premium', 'Enterprise'])}`;

      const product = {
        name,
        description: faker.lorem.sentences(2),
        price: category.price(),
        stock: category.isService ? 999 : faker.number.int({ min: 0, max: 100 }),
        status: faker.helpers.weightedArrayElement([
          { value: 'ACTIVE' as ProductStatus, weight: 0.85 },
          { value: 'INACTIVE' as ProductStatus, weight: 0.1 },
          { value: 'OUT_OF_STOCK' as ProductStatus, weight: 0.05 },
        ]),
        imageUrl: faker.helpers.maybe(
          () => `https://picsum.photos/seed/${faker.string.alphanumeric(10)}/400/300`,
          { probability: 0.7 },
        ),
        availableAt: faker.date.recent({ days: 30 }),
      };

      products.push(product);
    }
  }

  // Bulk create products
  const createdProducts = await prisma.product.createMany({
    data: products,
    skipDuplicates: true,
  });

  console.log(`✅ Created ${createdProducts.count} products`);
}

async function main() {
  try {
    console.log('🌱 Starting seed process...');
    console.log('');

    // Seed in order due to relations
    const organizations = await seedOrganizations();
    await seedCustomers(organizations);
    await seedProducts();

    console.log('');
    console.log('🎉 Seed completed successfully!');
    console.log('');
    console.log('📊 Summary:');
    const orgCount = await prisma.organization.count();
    const customerCount = await prisma.customer.count();
    const productCount = await prisma.product.count();

    console.log(`   Organizations: ${orgCount}`);
    console.log(`   Customers: ${customerCount}`);
    console.log(`   Products: ${productCount}`);
    console.log('');
    console.log('✨ You can now seed invoices:');
    console.log('   pnpm seed:invoices');
    console.log('');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
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
