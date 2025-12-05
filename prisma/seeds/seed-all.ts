import { prisma } from '../../src/lib/prisma';
import { execSync } from 'child_process';

/**
 * Master Seed Script
 * Runs all seed scripts in the correct order
 */

async function main() {
  console.log('🌱 Starting complete database seeding...');
  console.log('');

  try {
    // Step 1: Seed organizations
    const orgCount = await prisma.organization.count();
    if (orgCount === 0) {
      console.log('📋 Step 1: Seeding organizations...');
      execSync('pnpm exec tsx prisma/seeds/seed-organizations.ts', { stdio: 'inherit' });
      console.log('');
    } else {
      console.log('✅ Organizations already exist (skipping)');
      console.log(`   Organizations: ${orgCount}`);
      console.log('');
    }

    // Step 2: Seed customers
    const customerCount = await prisma.customer.count();
    if (customerCount === 0) {
      console.log('📋 Step 2: Seeding customers...');
      execSync('pnpm exec tsx prisma/seeds/seed-customers.ts', { stdio: 'inherit' });
      console.log('');
    } else {
      console.log('✅ Customers already exist (skipping)');
      console.log(`   Customers: ${customerCount}`);
      console.log('');
    }

    // Step 3: Seed products
    const productCount = await prisma.product.count();
    if (productCount === 0) {
      console.log('📋 Step 3: Seeding products...');
      execSync('pnpm exec tsx prisma/seeds/seed-products.ts', { stdio: 'inherit' });
      console.log('');
    } else {
      console.log('✅ Products already exist (skipping)');
      console.log(`   Products: ${productCount}`);
      console.log('');
    }

    // Step 4: Seed employees
    const employeeCount = await prisma.employee.count();
    if (employeeCount === 0) {
      console.log('📋 Step 4: Seeding employees...');
      execSync('pnpm exec tsx prisma/seeds/seed-employees.ts', { stdio: 'inherit' });
      console.log('');
    } else {
      console.log('✅ Employees already exist (skipping)');
      console.log(`   Employees: ${employeeCount}`);
      console.log('');
    }

    // Step 5: Seed invoices
    const invoiceCount = await prisma.invoice.count();
    if (invoiceCount === 0) {
      console.log('📋 Step 5: Seeding invoices...');
      execSync('pnpm exec tsx prisma/seeds/seed-invoices.ts', { stdio: 'inherit' });
      console.log('');
    } else {
      console.log('✅ Invoices already exist (skipping)');
      console.log(`   Invoices: ${invoiceCount}`);
      console.log('');
    }

    // Step 6: Seed quotes
    const quoteCount = await prisma.quote.count();
    if (quoteCount === 0) {
      console.log('📋 Step 6: Seeding quotes...');
      execSync('pnpm exec tsx prisma/seeds/seed-quotes.ts', { stdio: 'inherit' });
      console.log('');
    } else {
      console.log('✅ Quotes already exist (skipping)');
      console.log(`   Quotes: ${quoteCount}`);
      console.log('');
    }

    console.log('🎉 All seeding completed!');
    console.log('');
    console.log('📊 Final Summary:');
    const stats = {
      organizations: await prisma.organization.count(),
      customers: await prisma.customer.count(),
      employees: await prisma.employee.count(),
      products: await prisma.product.count(),
      invoices: await prisma.invoice.count(),
      invoiceItems: await prisma.invoiceItem.count(),
      quotes: await prisma.quote.count(),
      quoteItems: await prisma.quoteItem.count(),
    };

    console.log(`   Organizations: ${stats.organizations}`);
    console.log(`   Customers: ${stats.customers}`);
    console.log(`   Employees: ${stats.employees}`);
    console.log(`   Products: ${stats.products}`);
    console.log(`   Invoices: ${stats.invoices}`);
    console.log(`   Invoice Items: ${stats.invoiceItems}`);
    console.log(`   Quotes: ${stats.quotes}`);
    console.log(`   Quote Items: ${stats.quoteItems}`);
    console.log('');
    console.log('✨ Ready to go! Start your server: pnpm dev');
    console.log('');
  } catch (error) {
    console.error('❌ Error during seeding:', error);
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
