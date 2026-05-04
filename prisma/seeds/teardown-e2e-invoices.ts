/**
 * Removes E2E test data created by seedE2EInvoices.
 * Run via global-teardown.ts after all Playwright tests complete.
 */

import { prisma } from '@/lib/prisma';
import { fileURLToPath } from 'url';

export async function teardownE2EData(): Promise<void> {
  // Delete all invoices (and their items) for @e2e.test customers, including
  // any created through the UI during lifecycle tests (not just INV-E2E-* seeds).
  await prisma.invoiceItem.deleteMany({
    where: { invoice: { customer: { email: { endsWith: '@e2e.test' } } } }
  });

  await prisma.invoice.deleteMany({
    where: { customer: { email: { endsWith: '@e2e.test' } } }
  });

  await prisma.customer.deleteMany({
    where: { email: { endsWith: '@e2e.test' } }
  });

  console.log('Removed E2E seed invoices');
}

const isMain = process.argv[1] === fileURLToPath(import.meta.url);
if (isMain) {
  teardownE2EData()
    .then(() => console.log('Done'))
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}
