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

// One fixture per test that mutates state. customerIndex maps into E2E_QUOTE_CUSTOMERS.
const E2E_QUOTE_FIXTURES = [
  { customerIndex: 0, quoteNumber: 'QUO-E2E-0001', description: 'Floral Arrangement Service' }, // lifecycle: DRAFT → SENT → ACCEPTED → Invoice
  { customerIndex: 1, quoteNumber: 'QUO-E2E-0002', description: 'Floral Arrangement Service' }, // search / reset tests
  { customerIndex: 0, quoteNumber: 'QUO-E2E-0003', description: 'Wedding Bouquet' }, // reject test
  { customerIndex: 1, quoteNumber: 'QUO-E2E-0004', description: 'Sympathy Display' }, // cancel test
  { customerIndex: 0, quoteNumber: 'QUO-E2E-0005', description: 'Birthday Flowers' }, // delete test
  { customerIndex: 0, quoteNumber: 'QUO-E2E-0006', description: 'Corporate Arrangement' }, // duplicate test
  { customerIndex: 1, quoteNumber: 'QUO-E2E-0007', description: 'Anniversary Roses' }, // on hold test
  { customerIndex: 0, quoteNumber: 'QUO-E2E-0008', description: 'Spring Collection' }, // create version test
  { customerIndex: 1, quoteNumber: 'QUO-E2E-0009', description: 'Seasonal Centrepiece' }, // PDF download test
  { customerIndex: 0, quoteNumber: 'QUO-E2E-0010', description: 'Elegant Orchid Display' }, // email resend test
  { customerIndex: 1, quoteNumber: 'QUO-E2E-0011', description: 'Garden Party Flowers' }, // edit items test
  { customerIndex: 0, quoteNumber: 'QUO-E2E-0012', description: 'Tropical Arrangement' }, // unsaved changes test
  { customerIndex: 1, quoteNumber: 'QUO-E2E-0013', description: 'Minimalist Bouquet' }, // bulk delete 1
  { customerIndex: 1, quoteNumber: 'QUO-E2E-0014', description: 'Vintage Rose Collection' }, // bulk delete 2
];

/**
 * Seeds deterministic quote test data for the E2E tenant.
 * Creates two known customers and one DRAFT quote per fixture.
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

  // -- Ensure customers exist ------------------------------------------------

  const customerIds: Record<string, string> = {};

  for (const { firstName, lastName, email, gender } of E2E_QUOTE_CUSTOMERS) {
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

    customerIds[email] = customer.id;
  }

  // -- Ensure quotes exist ---------------------------------------------------

  const issuedDate = new Date(`${year}-01-15`);
  const validUntil = new Date(`${year}-06-15`);

  for (const { customerIndex, quoteNumber, description } of E2E_QUOTE_FIXTURES) {
    const { email, firstName, lastName } = E2E_QUOTE_CUSTOMERS[customerIndex];

    const existing = await prisma.quote.findFirst({
      where: { quoteNumber, tenantId: tenant.id },
      select: { id: true },
    });

    if (!existing) {
      await prisma.quote.create({
        data: {
          quoteNumber,
          customerId: customerIds[email],
          tenantId: tenant.id,
          status: QuoteStatus.DRAFT,
          currency: 'AUD',
          discount: 0,
          gst: 10,
          amount: 1100,
          issuedDate,
          validUntil,
          items: {
            create: [{ description, quantity: 1, unitPrice: 1000, total: 1000 }],
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
