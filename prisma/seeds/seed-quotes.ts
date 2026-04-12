import { prisma } from '@/lib/prisma';
import { InvoiceStatus, QuoteStatus } from '@/prisma/client';
import { faker } from '@faker-js/faker';
import { addDays } from 'date-fns';
import { fileURLToPath } from 'url';
import type { SeededTenant } from './seed-tenants';
import { batchAll } from './seed-helpers';

// -- Types -------------------------------------------------------------------

export type SeedQuotesOptions = {
  tenants: SeededTenant[];
  countPerTenant?: number;
};

// -- Data --------------------------------------------------------------------

const ITEM_DESCRIPTIONS = [
  'Wedding Bouquet Arrangement',
  'Sympathy Flower Display',
  'Birthday Celebration Flowers',
  'Anniversary Rose Bouquet',
  'Corporate Event Centrepiece',
  'Seasonal Mixed Arrangement',
  'Elegant Orchid Display',
  'Tropical Flower Collection',
  'Vintage Garden Arrangement',
  'Modern Minimalist Bouquet',
];

const COLOR_PALETTES = [
  ['#FF6B6B', '#FFE66D', '#4ECDC4'],
  ['#A8E6CF', '#DCEDC1', '#FFD3B6'],
  ['#E8D5C4', '#EEAC99', '#C98474'],
  ['#B4A7D6', '#D5AAFF', '#E6B0FF'],
  ['#FFB3BA', '#FFDFBA', '#FFFFBA'],
  ['#BAE1FF', '#BAFFC9', '#FFFFBA'],
];

// -- Seed function -----------------------------------------------------------

/**
 * Seeds quotes with full lifecycle history for each supplied tenant.
 * Quotes are linked to customers and products belonging to the same tenant.
 * Accepted quotes are partially converted to invoices.
 * @param options - The tenants to seed for.
 * @returns The total number of quotes created across all tenants.
 */
export async function seedQuotes(options: SeedQuotesOptions): Promise<number> {
  const { tenants, countPerTenant = 30 } = options;

  console.log(`\n💰 Seeding quotes for ${tenants.length} tenant(s)...`);

  let grandTotal = 0;

  for (const tenant of tenants) {
    const customers = await prisma.customer.findMany({
      where: { tenantId: tenant.id, deletedAt: null },
      select: { id: true },
      take: 25,
    });

    if (customers.length === 0) {
      console.log(`   ⚠️  ${tenant.name}: no customers found — skipping quotes`);
      continue;
    }

    const products = await prisma.product.findMany({
      where: { tenantId: tenant.id },
      select: { id: true },
      take: 15,
    });

    const year = new Date().getFullYear();

    const lastQuote = await prisma.quote.findFirst({
      where: { tenantId: tenant.id, quoteNumber: { startsWith: `QTE-${year}-` } },
      orderBy: { quoteNumber: 'desc' },
      select: { quoteNumber: true },
    });
    const startCounter = lastQuote ? parseInt(lastQuote.quoteNumber.split('-')[2], 10) + 1 : 1;

    // 1. Create DRAFT quotes in parallel
    const draftFns = Array.from({ length: countPerTenant }, (_, i) => async () => {
      const customer = faker.helpers.arrayElement(customers);
      const issuedDate = faker.date.between({ from: new Date(2024, 0, 1), to: new Date() });
      const validUntil = addDays(issuedDate, faker.number.int({ min: 14, max: 60 }));
      const discount = faker.helpers.weightedArrayElement([
        { value: 0, weight: 0.7 },
        { value: faker.number.float({ min: 50, max: 500, multipleOf: 10 }), weight: 0.3 },
      ]);
      const gst = 10;

      const itemCount = faker.number.int({ min: 1, max: 6 });
      const items = Array.from({ length: itemCount }, () => {
        const quantity = faker.number.int({ min: 1, max: 20 });
        const unitPrice = faker.number.float({ min: 50, max: 3000, multipleOf: 0.5 });
        return {
          description: faker.helpers.arrayElement(ITEM_DESCRIPTIONS),
          quantity,
          unitPrice,
          total: quantity * unitPrice,
          productId:
            products.length > 0 && faker.datatype.boolean({ probability: 0.4 })
              ? faker.helpers.arrayElement(products).id
              : null,
          colors:
            faker.helpers.maybe(() => faker.helpers.arrayElement(COLOR_PALETTES), {
              probability: 0.6,
            }) ?? [],
        };
      });

      const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
      const amount = subtotal + (subtotal * gst) / 100 - discount;
      const quoteNumber = `QTE-${year}-${String(startCounter + i).padStart(4, '0')}`;

      return prisma.quote.create({
        data: {
          quoteNumber,
          customerId: customer.id,
          status: QuoteStatus.DRAFT,
          currency: 'AUD',
          discount,
          gst,
          amount,
          issuedDate,
          validUntil,
          tenantId: tenant.id,
          notes:
            faker.helpers.maybe(() => faker.lorem.paragraph(), { probability: 0.5 }) ?? undefined,
          terms:
            faker.helpers.maybe(
              () =>
                'Payment due within 14 days of acceptance. 50% deposit required to commence work.',
              { probability: 0.7 },
            ) ?? undefined,
          items: { create: items },
        },
        select: { id: true },
      });
    });

    const { results: draftResults } = await batchAll(draftFns);
    const createdIds = draftResults.map((r) => r.id);

    // 2. Move most to SENT
    const toSend = faker.helpers.arrayElements(createdIds, { min: 20, max: 25 });
    for (const id of toSend) {
      try {
        await prisma.quote.update({
          where: { id },
          data: { status: QuoteStatus.SENT },
        });
        await prisma.quoteStatusHistory.create({
          data: {
            quoteId: id,
            status: QuoteStatus.SENT,
            previousStatus: QuoteStatus.DRAFT,
            notes: 'Quote sent to customer',
          },
        });
      } catch {
        // Ignore transition errors
      }
    }

    // 3. Process sent quotes
    const toProcess = faker.helpers.arrayElements(toSend, { min: 15, max: 20 });
    for (const id of toProcess) {
      const action = faker.helpers.weightedArrayElement([
        { value: 'ACCEPTED', weight: 0.6 },
        { value: 'REJECTED', weight: 0.15 },
        { value: 'ON_HOLD', weight: 0.15 },
        { value: 'CANCELLED', weight: 0.1 },
      ]);

      try {
        if (action === 'ACCEPTED') {
          await prisma.quote.update({
            where: { id },
            data: { status: QuoteStatus.ACCEPTED },
          });
          await prisma.quoteStatusHistory.create({
            data: {
              quoteId: id,
              status: QuoteStatus.ACCEPTED,
              previousStatus: QuoteStatus.SENT,
              notes: 'Quote accepted by customer',
            },
          });
        } else if (action === 'REJECTED') {
          await prisma.quote.update({
            where: { id },
            data: { status: QuoteStatus.REJECTED },
          });
          await prisma.quoteStatusHistory.create({
            data: {
              quoteId: id,
              status: QuoteStatus.REJECTED,
              previousStatus: QuoteStatus.SENT,
              notes: faker.helpers.arrayElement([
                'Too expensive',
                'No longer needed',
                'Other quote selected',
              ]),
            },
          });
        } else if (action === 'ON_HOLD') {
          await prisma.quote.update({
            where: { id },
            data: { status: QuoteStatus.ON_HOLD },
          });
          await prisma.quoteStatusHistory.create({
            data: {
              quoteId: id,
              status: QuoteStatus.ON_HOLD,
              previousStatus: QuoteStatus.SENT,
              notes: 'Waiting for venue confirmation',
            },
          });
        } else if (action === 'CANCELLED') {
          await prisma.quote.update({
            where: { id },
            data: { status: QuoteStatus.CANCELLED },
          });
          await prisma.quoteStatusHistory.create({
            data: {
              quoteId: id,
              status: QuoteStatus.CANCELLED,
              previousStatus: QuoteStatus.SENT,
              notes: 'Client decided not to proceed',
            },
          });
        }
      } catch {
        // Ignore transition errors
      }
    }

    // 4. Convert some ACCEPTED quotes to invoices
    const acceptedQuotes = await prisma.quote.findMany({
      where: { tenantId: tenant.id, id: { in: toProcess }, status: QuoteStatus.ACCEPTED },
      select: {
        id: true,
        customerId: true,
        gst: true,
        discount: true,
        amount: true,
        items: {
          select: {
            description: true,
            quantity: true,
            unitPrice: true,
            total: true,
            productId: true,
          },
        },
      },
    });

    const toConvert = faker.helpers.arrayElements(acceptedQuotes, {
      min: Math.min(3, acceptedQuotes.length),
      max: Math.min(7, acceptedQuotes.length),
    });

    let invoiceCounter = 1;
    for (const quote of toConvert) {
      try {
        const invoiceNumber = `INV-${year}-Q${String(invoiceCounter++).padStart(4, '0')}`;
        const dueDate = addDays(new Date(), 14);
        const discount = Number(quote.discount);
        const gst = Number(quote.gst);
        const subtotal = quote.items.reduce(
          (sum, item) => sum + item.quantity * Number(item.unitPrice),
          0,
        );
        const amount = subtotal + (subtotal * gst) / 100 - discount;

        const invoice = await prisma.invoice.create({
          data: {
            invoiceNumber,
            tenantId: tenant.id,
            customerId: quote.customerId,
            status: InvoiceStatus.DRAFT,
            currency: 'AUD',
            discount,
            gst,
            amount,
            amountDue: amount,
            amountPaid: 0,
            issuedDate: new Date(),
            dueDate,
            items: {
              create: quote.items.map((item) => ({
                description: item.description,
                quantity: item.quantity,
                unitPrice: Number(item.unitPrice),
                total: Number(item.total),
                productId: item.productId,
              })),
            },
          },
          select: { id: true },
        });

        await prisma.quote.update({
          where: { id: quote.id },
          data: { invoiceId: invoice.id },
        });
      } catch (error) {
        console.error(`Failed to convert quote to invoice for ${tenant.name}:`, error);
      }
    }

    grandTotal += createdIds.length;
    console.log(`   ✅ ${tenant.name}: ${createdIds.length} quotes`);
  }

  console.log(`✅ Created ${grandTotal} quote(s) across ${tenants.length} tenant(s)`);
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

    await seedQuotes({ tenants: seededTenants });
    console.log('\nDone.');
  })()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}
