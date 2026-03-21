import { prisma } from '@/lib/prisma';
import { TransactionType, TransactionStatus } from '@/prisma/client';
import { faker } from '@faker-js/faker';
import { subMonths } from 'date-fns';

/**
 * Seed Transactions
 * Creates both INCOME and EXPENSE transactions for testing
 */

export async function seedTransactions() {
  console.log('💰 Seeding transactions...');

  // Get vendors for expense transactions
  const vendors = await prisma.vendor.findMany({
    take: 10,
  });

  // Get invoices for income transactions
  const paidInvoices = await prisma.invoice.findMany({
    where: {
      status: 'PAID',
      deletedAt: null,
    },
    take: 20,
  });

  const transactions = [];

  // Generate 30 INCOME transactions (from customer payments)
  for (let i = 0; i < 30; i++) {
    const invoice = paidInvoices[i % paidInvoices.length];
    const date = faker.date.between({
      from: subMonths(new Date(), 6),
      to: new Date(),
    });

    transactions.push({
      type: TransactionType.INCOME,
      date,
      amount: invoice?.amount || faker.number.float({ min: 100, max: 5000, multipleOf: 0.01 }),
      currency: 'AUD',
      description: invoice
        ? `Payment received for ${invoice.invoiceNumber}`
        : `Customer payment - ${faker.company.name()}`,
      payee: invoice ? `Invoice ${invoice.invoiceNumber}` : faker.company.name(),
      status: TransactionStatus.COMPLETED,
      referenceNumber: `TXN-INC-${String(i + 1).padStart(6, '0')}`,
      referenceId: invoice?.id,
      invoiceId: invoice?.id,
      vendorId: undefined,
    });
  }

  // Generate 40 EXPENSE transactions (vendor payments and operational costs)
  const expenseCategories = [
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

  for (let i = 0; i < 40; i++) {
    const category = faker.helpers.arrayElement(expenseCategories);
    const vendor =
      category.vendor && vendors.length > 0 ? faker.helpers.arrayElement(vendors) : undefined;

    const date = faker.date.between({
      from: subMonths(new Date(), 6),
      to: new Date(),
    });

    const amount = faker.number.float({
      min: category.min,
      max: category.max,
      multipleOf: 0.01,
    });

    transactions.push({
      type: TransactionType.EXPENSE,
      date,
      amount,
      currency: 'AUD',
      description: vendor ? `${category.desc} - ${vendor.name}` : category.desc,
      payee: vendor?.name || faker.company.name(),
      status: faker.helpers.weightedArrayElement([
        { value: TransactionStatus.COMPLETED, weight: 0.9 },
        { value: TransactionStatus.PENDING, weight: 0.1 },
      ]),
      referenceNumber: `TXN-EXP-${String(i + 1).padStart(6, '0')}`,
      referenceId: vendor?.id,
      invoiceId: undefined,
      vendorId: vendor?.id,
    });
  }

  // Sort all transactions by date (oldest first)
  transactions.sort((a, b) => a.date.getTime() - b.date.getTime());

  // Create transactions in database
  const createdTransactions = [];
  for (const txn of transactions) {
    try {
      const created = await prisma.transaction.create({
        data: {
          ...txn,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
      createdTransactions.push(created);
    } catch (error) {
      console.error(`Failed to create transaction: ${txn.description}`, error);
    }
  }

  console.log(`✅ Created ${createdTransactions.length} transactions`);
  console.log(
    `   INCOME: ${createdTransactions.filter((t) => t.type === TransactionType.INCOME).length}`,
  );
  console.log(
    `   EXPENSE: ${createdTransactions.filter((t) => t.type === TransactionType.EXPENSE).length}`,
  );

  return createdTransactions;
}
