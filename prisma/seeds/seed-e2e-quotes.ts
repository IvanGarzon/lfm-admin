import { prisma } from '@/lib/prisma';
import { QuoteStatus } from '@/prisma/client';
import { fileURLToPath } from 'url';
import { env } from '@/env';

const E2E_TENANT_SLUG = env.E2E_SLUG;

// Fixed customers used by E2E quote tests. Separate email domain from invoice
// tests so invoice teardown does not wipe these records mid-run.
export const E2E_QUOTE_CUSTOMERS = [
  {
    firstName: 'Carol',
    lastName: 'Martinez',
    email: 'carol.martinez@e2e-quote.test',
    gender: 'FEMALE' as const,
  },
  {
    firstName: 'Dave',
    lastName: 'Nguyen',
    email: 'dave.nguyen@e2e-quote.test',
    gender: 'MALE' as const,
  },
];

/**
 * Seeds deterministic quote test data for the E2E tenant.
 * Creates two known customers and one DRAFT quote per customer.
 * Safe to run repeatedly — skips creation if records already exist.
 */
export async function seedE2EQuotes(): Promise<void> {
  if (!E2E_TENANT_SLUG) {
    throw new Error('E2E_SLUG must be set in .env before running e2e tests');
  }

  const tenant = await prisma.tenant.findUnique({ where: { slug: E2E_TENANT_SLUG } });

  if (!tenant) {
    console.log('   ⚠️  E2E tenant not found — run seed-e2e-environment.ts first');
    return;
  }

  const year = new Date().getFullYear();

  for (let i = 0; i < E2E_QUOTE_CUSTOMERS.length; i++) {
    const { firstName, lastName, email, gender } = E2E_QUOTE_CUSTOMERS[i];

    // -- Customer ------------------------------------------------------------

    let customer = await prisma.customer.findFirst({
      where: { email, tenantId: tenant.id },
      select: { id: true },
    });

    if (!customer) {
      customer = await prisma.customer.create({
        data: { tenantId: tenant.id, firstName, lastName, email, status: 'ACTIVE', gender },
        select: { id: true },
      });
      console.log(`   Created E2E customer: ${firstName} ${lastName}`);
    }

    // -- Quote ---------------------------------------------------------------

    const quoteNumber = `QUO-E2E-${String(i + 1).padStart(4, '0')}`;
    const existing = await prisma.quote.findFirst({
      where: { quoteNumber, tenantId: tenant.id },
      select: { id: true },
    });

    if (!existing) {
      const issuedDate = new Date(`${year}-01-15`);
      const validUntil = new Date(`${year}-06-15`);

      await prisma.quote.create({
        data: {
          quoteNumber,
          customerId: customer.id,
          tenantId: tenant.id,
          status: QuoteStatus.DRAFT,
          currency: 'AUD',
          discount: 0,
          gst: 10,
          amount: 1100,
          issuedDate,
          validUntil,
          items: {
            create: [
              {
                description: 'Floral Arrangement Service',
                quantity: 1,
                unitPrice: 1000,
                total: 1000,
              },
            ],
          },
        },
      });
      console.log(`   Created E2E quote: ${quoteNumber} for ${firstName} ${lastName}`);
    }
  }
}

// Allow running directly: pnpm tsx --env-file=.env prisma/seeds/seed-e2e-quotes.ts
const isMain = process.argv[1] === fileURLToPath(import.meta.url);
if (isMain) {
  seedE2EQuotes()
    .then(() => console.log('Done'))
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}
