/**
 * Full E2E environment teardown — run via global-teardown after all tests complete.
 *
 * Deletes all records under the e2e tenant in FK dependency order (deepest
 * children first so no constraint violations occur), then deletes the tenant.
 */

import { prisma } from '@/lib/prisma';
import { fileURLToPath } from 'url';

const E2E_TENANT_SLUG = 'e2e-test-tenant';

export async function teardownE2EEnvironment(): Promise<void> {
  const tenant = await prisma.tenant.findUnique({ where: { slug: E2E_TENANT_SLUG } });

  if (!tenant) {
    console.log('   E2E tenant not found — nothing to tear down');
    return;
  }

  await deleteTenantData(tenant.id);
  await prisma.tenant.delete({ where: { id: tenant.id } });

  console.log('   E2E environment removed');
}

/**
 * Deletes all records under a tenant in FK dependency order.
 * Shared by teardown and the stale-cleanup step in seed-e2e-environment.
 */
export async function deleteTenantData(tenantId: string): Promise<void> {
  // -- Quotes and their children ---------------------------------------------
  // QuoteItem and QuoteStatusHistory may or may not cascade — delete explicitly.

  await prisma.quoteItemAttachment.deleteMany({
    where: { quoteItem: { quote: { tenantId } } }
  });
  await prisma.quoteItem.deleteMany({ where: { quote: { tenantId } } });
  await prisma.quoteStatusHistory.deleteMany({ where: { quote: { tenantId } } });
  await prisma.quote.deleteMany({ where: { tenantId } });

  // -- Invoices (items, payments, status history all cascade from Invoice) ----

  await prisma.invoice.deleteMany({ where: { tenantId } });

  // -- Transactions (attachments and category-joins cascade from Transaction) -

  await prisma.transaction.deleteMany({ where: { tenantId } });
  await prisma.transactionCategory.deleteMany({ where: { tenantId } });

  // -- Recipes ---------------------------------------------------------------

  await prisma.recipeGroupItem.deleteMany({ where: { recipe: { tenantId } } });
  await prisma.recipeItem.deleteMany({ where: { recipe: { tenantId } } });
  await prisma.recipe.deleteMany({ where: { tenantId } });
  await prisma.recipeGroup.deleteMany({ where: { tenantId } });
  await prisma.recipeUnit.deleteMany({ where: { tenantId } });

  // -- Inventory -------------------------------------------------------------

  await prisma.priceListItem.deleteMany({ where: { tenantId } });
  await prisma.product.deleteMany({ where: { tenantId } });
  await prisma.vendor.deleteMany({ where: { tenantId } });

  // -- CRM -------------------------------------------------------------------

  await prisma.customer.deleteMany({ where: { tenantId } });
  await prisma.organization.deleteMany({ where: { tenantId } });

  // -- Staff -----------------------------------------------------------------

  await prisma.employee.deleteMany({ where: { tenantId } });

  // -- Users (must be detached before tenant delete; no FK cascade) ----------

  await prisma.user.deleteMany({ where: { tenantId } });
}

// Allow running directly: pnpm tsx --env-file=.env prisma/seeds/teardown-e2e-environment.ts
const isMain = process.argv[1] === fileURLToPath(import.meta.url);
if (isMain) {
  teardownE2EEnvironment()
    .then(() => console.log('Done'))
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}
