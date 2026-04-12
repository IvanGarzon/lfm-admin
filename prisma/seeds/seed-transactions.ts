import { prisma } from '@/lib/prisma';
import { TransactionType, TransactionStatus } from '@/prisma/client';
import { faker } from '@faker-js/faker';
import { subMonths } from 'date-fns';
import { fileURLToPath } from 'url';
import { randomUUID } from 'crypto';
import type { SeededTenant } from './seed-tenants';

function generateReferenceNumber(): string {
  return `TRX-${randomUUID().replace(/-/g, '').substring(0, 8).toUpperCase()}`;
}

// -- Types -------------------------------------------------------------------

export type SeedTransactionsOptions = {
  tenants: SeededTenant[];
};

// -- Data --------------------------------------------------------------------

const EXPENSE_CATEGORIES = [
  { desc: 'Wholesale flowers purchase', vendor: true, min: 200, max: 1500 },
  { desc: 'Floral supplies and accessories', vendor: true, min: 50, max: 500 },
  { desc: 'Delivery and courier services', vendor: true, min: 30, max: 200 },
  { desc: 'Packaging materials', vendor: true, min: 100, max: 400 },
  { desc: 'Office rent payment', vendor: false, min: 1500, max: 2500 },
  { desc: 'Utilities - electricity and water', vendor: false, min: 150, max: 350 },
  { desc: 'Marketing and advertising', vendor: false, min: 200, max: 800 },
  { desc: 'Website and domain hosting', vendor: false, min: 50, max: 150 },
  { desc: 'Insurance premium', vendor: false, min: 300, max: 600 },
  { desc: 'Equipment maintenance', vendor: false, min: 100, max: 500 },
  { desc: 'Professional development', vendor: false, min: 150, max: 400 },
  { desc: 'Bank fees and charges', vendor: false, min: 20, max: 100 },
];

// -- Seed function -----------------------------------------------------------

/**
 * Seeds income and expense transactions for each supplied tenant.
 * Income transactions are linked to PAID invoices; expense transactions
 * are linked to vendors — all scoped to the same tenant.
 * @param options - The tenants to seed for.
 * @returns The total number of transactions created across all tenants.
 */
export async function seedTransactions(options: SeedTransactionsOptions): Promise<number> {
  const { tenants } = options;

  console.log(`\n💸 Seeding transactions for ${tenants.length} tenant(s)...`);

  let grandTotal = 0;

  for (const tenant of tenants) {
    const vendors = await prisma.vendor.findMany({
      where: { tenantId: tenant.id },
      select: { id: true, name: true },
      take: 10,
    });

    const paidInvoices = await prisma.invoice.findMany({
      where: { tenantId: tenant.id, status: 'PAID', deletedAt: null },
      select: { id: true, amount: true, invoiceNumber: true },
      take: 20,
    });

    const transactions = [];

    // INCOME transactions from paid invoices
    for (let i = 0; i < 20; i++) {
      const invoice = paidInvoices[i % Math.max(paidInvoices.length, 1)];
      const date = faker.date.between({ from: subMonths(new Date(), 6), to: new Date() });

      transactions.push({
        tenantId: tenant.id,
        type: TransactionType.INCOME,
        date,
        amount: invoice?.amount ?? faker.number.float({ min: 100, max: 5000, multipleOf: 0.01 }),
        currency: 'AUD',
        description: invoice
          ? `Payment received for ${invoice.invoiceNumber}`
          : `Customer payment - ${faker.company.name()}`,
        payee: invoice ? `Invoice ${invoice.invoiceNumber}` : faker.company.name(),
        status: TransactionStatus.COMPLETED,
        referenceNumber: generateReferenceNumber(),
        referenceId: invoice?.id ?? null,
        invoiceId: invoice?.id ?? null,
        vendorId: null,
      });
    }

    // EXPENSE transactions linked to vendors
    for (let i = 0; i < 30; i++) {
      const category = faker.helpers.arrayElement(EXPENSE_CATEGORIES);
      const vendor =
        category.vendor && vendors.length > 0 ? faker.helpers.arrayElement(vendors) : null;
      const date = faker.date.between({ from: subMonths(new Date(), 6), to: new Date() });

      transactions.push({
        tenantId: tenant.id,
        type: TransactionType.EXPENSE,
        date,
        amount: faker.number.float({ min: category.min, max: category.max, multipleOf: 0.01 }),
        currency: 'AUD',
        description: vendor ? `${category.desc} - ${vendor.name}` : category.desc,
        payee: vendor?.name ?? faker.company.name(),
        status: faker.helpers.weightedArrayElement([
          { value: TransactionStatus.COMPLETED, weight: 0.9 },
          { value: TransactionStatus.PENDING, weight: 0.1 },
        ]),
        referenceNumber: generateReferenceNumber(),
        referenceId: vendor?.id ?? null,
        invoiceId: null,
        vendorId: vendor?.id ?? null,
      });
    }

    // Sort by date oldest-first
    transactions.sort((a, b) => a.date.getTime() - b.date.getTime());

    await prisma.transaction.createMany({ data: transactions });

    grandTotal += transactions.length;
    console.log(`   ✅ ${tenant.name}: ${transactions.length} transactions`);
  }

  console.log(`✅ Created ${grandTotal} transaction(s) across ${tenants.length} tenant(s)`);
  return grandTotal;
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

    const seededTenants = tenants.map((t) => ({
      ...t,
      adminEmail: '',
      managerEmail: '',
      password: '',
    }));

    await seedTransactions({ tenants: seededTenants });
    console.log('\nDone.');
  })()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}
