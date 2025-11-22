import { PrismaClient } from '@/prisma/client';
import { execSync } from 'child_process';

const prisma = new PrismaClient();

/**
 * Master Seed Script
 * Runs all seed scripts in the correct order
 */

async function main() {
  console.log('🌱 Starting complete database seeding...');
  console.log('');

  try {
    // Check if we need to seed base data
    const customerCount = await prisma.customer.count();
    const productCount = await prisma.product.count();

    if (customerCount === 0 || productCount === 0) {
      console.log('📋 Step 1: Seeding base data (Organizations, Customers, Products)...');
      execSync('pnpm exec tsx prisma/seed-base.ts', { stdio: 'inherit' });
      console.log('');
    } else {
      console.log('✅ Base data already exists (skipping)');
      console.log(`   Customers: ${customerCount}`);
      console.log(`   Products: ${productCount}`);
      console.log('');
    }

    // Check if we need to seed invoices
    const invoiceCount = await prisma.invoice.count();

    if (invoiceCount === 0) {
      console.log('📋 Step 2: Seeding invoices...');
      execSync('pnpm exec tsx prisma/seed-invoices.ts', { stdio: 'inherit' });
      console.log('');
    } else {
      console.log('✅ Invoices already exist (skipping)');
      console.log(`   Invoices: ${invoiceCount}`);
      console.log('');
    }

    console.log('🎉 All seeding completed!');
    console.log('');
    console.log('📊 Final Summary:');
    const stats = {
      organizations: await prisma.organization.count(),
      customers: await prisma.customer.count(),
      products: await prisma.product.count(),
      invoices: await prisma.invoice.count(),
      invoiceItems: await prisma.invoiceItem.count(),
    };

    console.log(`   Organizations: ${stats.organizations}`);
    console.log(`   Customers: ${stats.customers}`);
    console.log(`   Products: ${stats.products}`);
    console.log(`   Invoices: ${stats.invoices}`);
    console.log(`   Invoice Items: ${stats.invoiceItems}`);
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
