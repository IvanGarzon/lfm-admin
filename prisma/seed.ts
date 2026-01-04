import { prisma } from '@/lib/prisma';
import { seedOrganizations } from './seeds/seed-organizations';
import { seedCustomers } from './seeds/seed-customers';
import { seedProducts } from './seeds/seed-products';
import { seedEmployees } from './seeds/seed-employees';
import { seedInvoices } from './seeds/seed-invoices';
import { seedQuotes } from './seeds/seed-quotes';

async function main() {
  console.log('Cleaning up tables...');
  await prisma.transactionCategoryOnTransaction.deleteMany();
  await prisma.transactionAttachment.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.invoiceStatusHistory.deleteMany();
  await prisma.invoiceItem.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.quoteStatusHistory.deleteMany();
  await prisma.quoteItemAttachment.deleteMany();
  await prisma.quoteItem.deleteMany();
  await prisma.quote.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.employee.deleteMany();
  await prisma.organization.deleteMany();
  await prisma.product.deleteMany();

  console.log('🌱 Starting complete database seeding...');
  console.log('');

  try {
    // Step 1: Seed organizations
    const orgCount = await prisma.organization.count();
    if (orgCount === 0) {
      console.log('📋 Step 1: Seeding organizations...');
      await seedOrganizations();
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
      await seedCustomers();
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
      await seedProducts();
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
      await seedEmployees();
      console.log('');
    } else {
      console.log('✅ Employees already exist (skipping)');
      console.log(`   Employees: ${employeeCount}`);
      console.log('');
    }

    // Step 5: Seed quotes
    console.log('📋 Step 5: Seeding quotes...');
    await seedQuotes();
    console.log('');

    // Step 6: Seed invoices
    console.log('📋 Step 6: Seeding invoices...');
    await seedInvoices();
    console.log('');

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
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
