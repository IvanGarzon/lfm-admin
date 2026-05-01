import { prisma } from '@/lib/prisma';
import { InvoiceStatus } from '@/prisma/client';
import { fileURLToPath } from 'url';

const E2E_TENANT_SLUG = 'e2e-test-tenant';

// Fixed customers used by E2E invoice tests. Deterministic so tests can
// assert by name without depending on random seed data.
export const E2E_INVOICE_CUSTOMERS = [
  {
    firstName: 'Alice',
    lastName: 'Thornton',
    email: 'alice.thornton@e2e.test',
    gender: 'FEMALE' as const
  },
  {
    firstName: 'Bob',
    lastName: 'Kellerman',
    email: 'bob.kellerman@e2e.test',
    gender: 'MALE' as const
  }
];

/**
 * Seeds deterministic invoice test data for the E2E tenant.
 * Creates two known customers and one DRAFT invoice per customer.
 * Safe to run repeatedly — skips creation if records already exist.
 */
export async function seedE2EInvoices(): Promise<void> {
  const tenant = await prisma.tenant.findUnique({ where: { slug: E2E_TENANT_SLUG } });

  if (!tenant) {
    console.log('   ⚠️  E2E tenant not found — run seed-e2e-user.ts first');
    return;
  }

  const year = new Date().getFullYear();

  for (let i = 0; i < E2E_INVOICE_CUSTOMERS.length; i++) {
    const { firstName, lastName, email, gender } = E2E_INVOICE_CUSTOMERS[i];

    // -- Customer ------------------------------------------------------------

    let customer = await prisma.customer.findFirst({
      where: { email, tenantId: tenant.id },
      select: { id: true }
    });

    if (!customer) {
      customer = await prisma.customer.create({
        data: { tenantId: tenant.id, firstName, lastName, email, status: 'ACTIVE', gender },
        select: { id: true }
      });
      console.log(`   Created E2E customer: ${firstName} ${lastName}`);
    }

    // -- Invoice -------------------------------------------------------------

    const invoiceNumber = `INV-E2E-${String(i + 1).padStart(4, '0')}`;
    const existing = await prisma.invoice.findFirst({
      where: { invoiceNumber, tenantId: tenant.id },
      select: { id: true }
    });

    if (!existing) {
      const issuedDate = new Date(`${year}-01-15`);
      const dueDate = new Date(`${year}-02-15`);

      await prisma.invoice.create({
        data: {
          invoiceNumber,
          customerId: customer.id,
          tenantId: tenant.id,
          status: InvoiceStatus.DRAFT,
          currency: 'AUD',
          discount: 0,
          gst: 10,
          amount: 1100,
          amountDue: 1100,
          amountPaid: 0,
          issuedDate,
          dueDate,
          items: {
            create: [
              {
                description: 'Floral Arrangement Service',
                quantity: 1,
                unitPrice: 1000,
                total: 1000
              }
            ]
          }
        }
      });
      console.log(`   Created E2E invoice: ${invoiceNumber} for ${firstName} ${lastName}`);
    }
  }
}

// Allow running directly: pnpm tsx --env-file=.env prisma/seeds/seed-e2e-invoices.ts
const isMain = process.argv[1] === fileURLToPath(import.meta.url);
if (isMain) {
  seedE2EInvoices()
    .then(() => console.log('Done'))
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}
