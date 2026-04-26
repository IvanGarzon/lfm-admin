import { prisma } from '@/lib/prisma';
import { InvoiceStatus } from '@/prisma/client';
import { faker } from '@faker-js/faker';
import { fileURLToPath } from 'url';
import type { SeededTenant } from './seed-tenants';
import { batchAll } from './seed-helpers';

// -- Types -------------------------------------------------------------------

export type SeedInvoicesOptions = {
  tenants: SeededTenant[];
  countPerTenant?: number;
};

// -- Seed function -----------------------------------------------------------

const PAYMENT_METHODS = ['Bank Transfer', 'Credit Card', 'PayPal', 'Cash', 'Cheque'];

const ITEM_DESCRIPTIONS = [
  'Floral Arrangement Service',
  'Wedding Bouquet Package',
  'Corporate Event Flowers',
  'Sympathy Arrangement',
  'Birthday Flower Delivery',
  'Anniversary Special',
  'Seasonal Flower Box',
  'Premium Rose Bouquet',
  'Orchid Collection',
  'Tropical Arrangement',
  'Arrangement for Funeral',
];

/**
 * Seeds invoices with full lifecycle history for each supplied tenant.
 * Invoices are linked to customers and products belonging to the same tenant
 * to maintain correct data isolation.
 * @param options - The tenants to seed for.
 * @returns The total number of invoices created across all tenants.
 */
export async function seedInvoices(options: SeedInvoicesOptions): Promise<number> {
  const { tenants, countPerTenant = 30 } = options;

  console.log(`\n🌱 Seeding invoices for ${tenants.length} tenant(s)...`);

  let grandTotal = 0;

  for (const tenant of tenants) {
    const customers = await prisma.customer.findMany({
      where: { tenantId: tenant.id, deletedAt: null },
      select: { id: true },
      take: 20,
    });

    if (customers.length === 0) {
      console.log(`   ⚠️  ${tenant.name}: no customers found — skipping invoices`);
      continue;
    }

    const products = await prisma.product.findMany({
      where: { tenantId: tenant.id },
      select: { id: true },
      take: 10,
    });

    const year = new Date().getFullYear();

    const rows = await prisma.$queryRaw<{ invoice_number: string }[]>`
      SELECT invoice_number FROM invoices
      WHERE tenant_id = ${tenant.id}
        AND invoice_number ~ ${`^INV-${year}-\\d{4}$`}
      ORDER BY invoice_number DESC LIMIT 1`;
    const startCounter = rows.length ? parseInt(rows[0].invoice_number.split('-')[2], 10) + 1 : 1;

    // 1. Create DRAFT invoices in parallel
    const draftFns = Array.from({ length: countPerTenant }, (_, i) => async () => {
      const customer = faker.helpers.arrayElement(customers);
      const issuedDate = faker.date.between({ from: new Date(2025, 0, 1), to: new Date() });
      const dueDate = new Date(issuedDate);
      dueDate.setDate(dueDate.getDate() + faker.number.int({ min: 14, max: 90 }));

      const itemCount = faker.number.int({ min: 1, max: 5 });
      const discount = faker.helpers.weightedArrayElement([
        { value: 0, weight: 0.7 },
        { value: faker.number.float({ min: 50, max: 500, multipleOf: 10 }), weight: 0.3 },
      ]);
      const gst = 10;

      const items = Array.from({ length: itemCount }, () => {
        const quantity = faker.number.int({ min: 1, max: 10 });
        const unitPrice = faker.number.float({ min: 50, max: 5000, multipleOf: 0.5 });
        return {
          description: faker.helpers.arrayElement(ITEM_DESCRIPTIONS),
          quantity,
          unitPrice,
          total: quantity * unitPrice,
          productId:
            products.length > 0 && faker.datatype.boolean({ probability: 0.5 })
              ? faker.helpers.arrayElement(products).id
              : null,
        };
      });

      const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
      const amount = subtotal + (subtotal * gst) / 100 - discount;
      const invoiceNumber = `INV-${year}-${String(startCounter + i).padStart(4, '0')}`;

      return prisma.invoice.create({
        data: {
          invoiceNumber,
          customerId: customer.id,
          status: InvoiceStatus.DRAFT,
          currency: 'AUD',
          discount,
          gst,
          amount,
          amountDue: amount,
          amountPaid: 0,
          issuedDate,
          dueDate,
          tenantId: tenant.id,
          notes:
            faker.helpers.maybe(() => faker.lorem.sentence(), { probability: 0.3 }) ?? undefined,
          items: { create: items },
        },
        select: { id: true },
      });
    });

    const { results: draftResults } = await batchAll(draftFns);
    const createdIds = draftResults.map((r) => r.id);

    // 2. Move most DRAFTs to PENDING
    const draftInvoices = await prisma.invoice.findMany({
      where: { tenantId: tenant.id, status: InvoiceStatus.DRAFT, deletedAt: null },
      select: { id: true },
    });

    for (const inv of draftInvoices) {
      if (faker.datatype.boolean({ probability: 0.8 })) {
        try {
          await prisma.invoice.update({
            where: { id: inv.id },
            data: { status: InvoiceStatus.PENDING },
          });
          await prisma.invoiceStatusHistory.create({
            data: {
              invoiceId: inv.id,
              status: InvoiceStatus.PENDING,
              previousStatus: InvoiceStatus.DRAFT,
              notes: 'Invoice marked as pending',
            },
          });
        } catch {
          // Ignore transition errors
        }
      }
    }

    // 3. Record payments for some PENDING invoices
    const pendingInvoices = await prisma.invoice.findMany({
      where: { tenantId: tenant.id, status: InvoiceStatus.PENDING, deletedAt: null },
      select: { id: true, amount: true, issuedDate: true },
    });

    const toPay = faker.helpers.arrayElements(pendingInvoices, {
      min: Math.floor(pendingInvoices.length * 0.4),
      max: Math.floor(pendingInvoices.length * 0.7),
    });

    for (const inv of toPay) {
      try {
        const isPartial = faker.datatype.boolean({ probability: 0.2 });
        const amountToPay = isPartial ? Number(inv.amount) / 2 : Number(inv.amount);
        const payDate = faker.date.between({ from: inv.issuedDate, to: new Date() });
        const method = faker.helpers.arrayElement(PAYMENT_METHODS);

        await prisma.payment.create({
          data: {
            invoiceId: inv.id,
            amount: amountToPay,
            method: method,
            date: payDate,
            notes: isPartial ? 'Partial payment received' : 'Full payment received',
          },
        });

        if (isPartial && faker.datatype.boolean({ probability: 0.5 })) {
          await prisma.payment.create({
            data: {
              invoiceId: inv.id,
              amount: amountToPay,
              method: method,
              date: new Date(),
              notes: 'Final payment',
            },
          });
        }
      } catch {
        // Ignore payment errors
      }
    }

    // 4. Cancel or overdue some remaining PENDING invoices
    const remainingPending = await prisma.invoice.findMany({
      where: { tenantId: tenant.id, status: InvoiceStatus.PENDING, deletedAt: null },
      select: { id: true },
    });

    for (const inv of remainingPending) {
      const action = faker.helpers.weightedArrayElement([
        { value: 'CANCEL', weight: 0.1 },
        { value: 'OVERDUE', weight: 0.2 },
        { value: 'KEEP', weight: 0.7 },
      ]);

      try {
        if (action === 'CANCEL') {
          await prisma.invoice.update({
            where: { id: inv.id },
            data: { status: InvoiceStatus.CANCELLED },
          });
          await prisma.invoiceStatusHistory.create({
            data: {
              invoiceId: inv.id,
              status: InvoiceStatus.CANCELLED,
              previousStatus: InvoiceStatus.PENDING,
              notes: faker.helpers.arrayElement([
                'Client Request',
                'Duplicate Invoice',
                'Pricing Error',
              ]),
            },
          });
        } else if (action === 'OVERDUE') {
          await prisma.invoice.update({
            where: { id: inv.id },
            data: { status: InvoiceStatus.OVERDUE },
          });
          await prisma.invoiceStatusHistory.create({
            data: {
              invoiceId: inv.id,
              status: InvoiceStatus.OVERDUE,
              previousStatus: InvoiceStatus.PENDING,
              notes: 'Invoice marked as overdue (System)',
            },
          });
        }
      } catch {
        // Ignore transition errors
      }
    }

    grandTotal += createdIds.length;
    console.log(`   ✅ ${tenant.name}: ${createdIds.length} invoices`);
  }

  console.log(`✅ Created ${grandTotal} invoice(s) across ${tenants.length} tenant(s)`);
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

    await seedInvoices({ tenants: seededTenants });
    console.log('\nDone.');
  })()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}
