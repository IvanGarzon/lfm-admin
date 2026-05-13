/**
 * Removes E2E quote test data for the e2e tenant.
 * Deletes in FK dependency order — attachments → items → history → quotes.
 * Customers are left in place; global-teardown removes the whole tenant.
 */

import { prisma } from '@/lib/prisma';
import { fileURLToPath } from 'url';
import { env } from '@/env';

const E2E_TENANT_SLUG = env.E2E_SLUG;

export async function teardownE2EQuotes(): Promise<void> {
  if (!E2E_TENANT_SLUG) {
    throw new Error('E2E_SLUG must be set in .env before running e2e tests');
  }

  const tenant = await prisma.tenant.findUnique({ where: { slug: E2E_TENANT_SLUG } });

  if (!tenant) {
    console.log('   E2E tenant not found — nothing to tear down');
    return;
  }

  await prisma.quoteItemAttachment.deleteMany({
    where: { quoteItem: { quote: { tenantId: tenant.id } } },
  });
  await prisma.quoteItem.deleteMany({ where: { quote: { tenantId: tenant.id } } });
  await prisma.quoteStatusHistory.deleteMany({ where: { quote: { tenantId: tenant.id } } });
  await prisma.quote.deleteMany({ where: { tenantId: tenant.id } });

  console.log('   Removed E2E seed quotes');
}

const isMain = process.argv[1] === fileURLToPath(import.meta.url);
if (isMain) {
  teardownE2EQuotes()
    .then(() => console.log('Done'))
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}
