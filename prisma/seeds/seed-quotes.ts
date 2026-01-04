import { prisma } from '@/lib/prisma';
import { QuoteStatus } from '@/prisma/client';
import { faker } from '@faker-js/faker';
import { addDays } from 'date-fns';
import { QuoteRepository } from '@/repositories/quote-repository';
import { InvoiceRepository } from '@/repositories/invoice-repository';

/**
 * Seed Quote Data
 * Generates fake quotes with items for testing
 */

export async function seedQuotes() {
  console.log('💰 Seeding quotes with lifecycle history...');

  const quoteRepo = new QuoteRepository(prisma);
  const invoiceRepo = new InvoiceRepository(prisma);

  // Get existing customers
  const customers = await prisma.customer.findMany({
    take: 25,
  });

  if (customers.length === 0) {
    console.log('⚠️  No customers found. Please seed customers first.');
    return;
  }

  // Get existing products (optional)
  const products = await prisma.product.findMany({
    take: 15,
  });

  // Color palettes for quote items (flower arrangements)
  const colorPalettes = [
    ['#FF6B6B', '#FFE66D', '#4ECDC4'],
    ['#A8E6CF', '#DCEDC1', '#FFD3B6'],
    ['#E8D5C4', '#EEAC99', '#C98474'],
    ['#B4A7D6', '#D5AAFF', '#E6B0FF'],
    ['#FFB3BA', '#FFDFBA', '#FFFFBA'],
    ['#BAE1FF', '#BAFFC9', '#FFFFBA'],
  ];

  const createdQuoteIds: string[] = [];

  for (let i = 0; i < 40; i++) {
    const customer = faker.helpers.arrayElement(customers);
    const issuedDate = faker.date.between({
      from: new Date(2024, 0, 1),
      to: new Date(),
    });
    const validUntil = addDays(issuedDate, faker.number.int({ min: 14, max: 60 }));

    // Generate items
    const itemCount = faker.number.int({ min: 1, max: 6 });
    const items: any[] = [];

    for (let j = 0; j < itemCount; j++) {
      const quantity = faker.number.int({ min: 1, max: 20 });
      const unitPrice = faker.number.float({ min: 50, max: 3000, multipleOf: 0.5 });

      const colors =
        faker.helpers.maybe(() => faker.helpers.arrayElement(colorPalettes), {
          probability: 0.6,
        }) || [];

      items.push({
        description: faker.helpers.arrayElement([
          'Wedding Bouquet Arrangement',
          'Sympathy Flower Display',
          'Birthday Celebration Flowers',
          'Anniversary Rose Bouquet',
          'Corporate Event Centerpiece',
          'Seasonal Mixed Arrangement',
          'Elegant Orchid Display',
          'Tropical Flower Collection',
          'Vintage Garden Arrangement',
          'Modern Minimalist Bouquet',
        ]),
        quantity,
        unitPrice,
        productId:
          products.length > 0 && faker.datatype.boolean({ probability: 0.4 })
            ? faker.helpers.arrayElement(products).id
            : null,
      });
    }

    try {
      // Always create as DRAFT first
      const { id } = await quoteRepo.createQuoteWithItems({
        customerId: customer.id,
        status: QuoteStatus.DRAFT,
        currency: 'AUD',
        discount: faker.helpers.weightedArrayElement([
          { value: 0, weight: 0.7 },
          { value: faker.number.float({ min: 50, max: 500, multipleOf: 10 }), weight: 0.3 },
        ]),
        gst: 10,
        issuedDate,
        validUntil,
        items,
        notes:
          faker.helpers.maybe(() => faker.lorem.paragraph(), { probability: 0.5 }) ?? undefined,
        terms:
          faker.helpers.maybe(
            () =>
              'Payment due within 14 days of acceptance. 50% deposit required to commence work.',
            { probability: 0.7 },
          ) ?? undefined,
      });

      createdQuoteIds.push(id);
    } catch (error) {
      console.error(`Failed to create quote structure:`, error);
    }
  }

  console.log(`✅ Created ${createdQuoteIds.length} DRAFT quotes. Processing transitions...`);

  // Process transitions
  // 1. Move some to SENT
  const sentQuotes = faker.helpers.arrayElements(createdQuoteIds, { min: 25, max: 35 });
  for (const id of sentQuotes) {
    try {
      await quoteRepo.markAsSent(id);
    } catch (e) {
      console.error(`Failed to mark quote ${id} as SENT:`, e);
    }
  }

  // 2. Move some SENT to ACCEPTED, REJECTED, ON_HOLD, or CANCELLED
  const processedSent = faker.helpers.arrayElements(sentQuotes, { min: 20, max: 25 });
  for (const id of processedSent) {
    const action = faker.helpers.weightedArrayElement([
      { value: 'ACCEPTED', weight: 0.6 },
      { value: 'REJECTED', weight: 0.15 },
      { value: 'ON_HOLD', weight: 0.15 },
      { value: 'CANCELLED', weight: 0.1 },
    ]);

    try {
      if (action === 'ACCEPTED') {
        await quoteRepo.markAsAccepted(id);
      } else if (action === 'REJECTED') {
        await quoteRepo.markAsRejected(
          id,
          faker.helpers.arrayElement(['Too expensive', 'No longer needed', 'Other quote selected']),
        );
      } else if (action === 'ON_HOLD') {
        await quoteRepo.markAsOnHold(id, 'Waiting for venue confirmation');
      } else if (action === 'CANCELLED') {
        await quoteRepo.markAsCancelled(id, 'Client decided not to proceed');
      }
    } catch (e) {
      // Ignore transition errors
    }
  }

  // 3. Convert some ACCEPTED to INVOICE
  const acceptedQuotes = await prisma.quote.findMany({
    where: { id: { in: processedSent }, status: QuoteStatus.ACCEPTED },
    select: { id: true, amount: true, gst: true, discount: true },
  });

  const toConvert = faker.helpers.arrayElements(acceptedQuotes, { min: 5, max: 10 });
  for (const quote of toConvert) {
    try {
      const invoiceNumber = await invoiceRepo.generateInvoiceNumber();
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 14);

      await quoteRepo.convertToInvoice(quote.id, {
        invoiceNumber,
        gst: Number(quote.gst),
        discount: Number(quote.discount),
        dueDate,
      });
    } catch (e) {
      console.error(`Failed to convert quote ${quote.id} to invoice:`, e);
    }
  }

  console.log(`✅ Quote transitions completed.`);
}
