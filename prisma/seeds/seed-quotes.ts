import { prisma } from '@/lib/prisma';
import { QuoteStatus } from '@/prisma/client';
import { faker } from '@faker-js/faker';
import { addDays } from 'date-fns';

interface QuoteItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  order: number;
  colors: string[];
  notes: string | null;
  productId: string | null;
}

interface Quote {
  quoteNumber: string;
  customerId: string;
  status: QuoteStatus;
  amount: number;
  currency: string;
  discount: number;
  gst: number;
  issuedDate: Date;
  validUntil: Date;
  notes: string | null;
  terms: string | null;
  items: {
    create: QuoteItem[];
  };
}

/**
 * Seed Quote Data
 * Generates fake quotes with items for testing
 */

export async function seedQuotes() {
  console.log('💰 Seeding quotes...');

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

  const statuses: QuoteStatus[] = ['DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'EXPIRED', 'ON_HOLD', 'CANCELLED'];

  // Color palettes for quote items (flower arrangements)
  const colorPalettes = [
    ['#FF6B6B', '#FFE66D', '#4ECDC4'],
    ['#A8E6CF', '#DCEDC1', '#FFD3B6'],
    ['#E8D5C4', '#EEAC99', '#C98474'],
    ['#B4A7D6', '#D5AAFF', '#E6B0FF'],
    ['#FFB3BA', '#FFDFBA', '#FFFFBA'],
    ['#BAE1FF', '#BAFFC9', '#FFFFBA'],
  ];

  const quotes = [];

  for (let i = 0; i < 40; i++) {
    const customer = faker.helpers.arrayElement(customers);
    const status = faker.helpers.arrayElement(statuses);
    const issuedDate = faker.date.between({
      from: new Date(2024, 0, 1),
      to: new Date(),
    });
    const validUntil = addDays(issuedDate, faker.number.int({ min: 14, max: 60 }));

    // Generate items
    const itemCount = faker.number.int({ min: 1, max: 6 });
    const items: QuoteItem[] = [];
    let totalAmount = 0;

    for (let j = 0; j < itemCount; j++) {
      const quantity = faker.number.int({ min: 1, max: 20 });
      const unitPrice = faker.number.float({ min: 50, max: 3000, multipleOf: 0.01 });
      const total = quantity * unitPrice;
      totalAmount += total;

      // Random color palette for this item
      const colors = faker.helpers.maybe(
        () => faker.helpers.arrayElement(colorPalettes),
        { probability: 0.6 },
      ) || [];

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
        total,
        order: j,
        colors,
        notes: faker.helpers.maybe(
          () => faker.helpers.arrayElement([
            'Client prefers pastel colors',
            'Include seasonal flowers',
            'Eco-friendly packaging requested',
            'Fragrance-free arrangement',
            'Long-lasting varieties preferred',
            'Specific delivery time required',
          ]),
          { probability: 0.3 },
        ) ?? null,
        productId:
          products.length > 0 && faker.datatype.boolean({ probability: 0.4 })
            ? faker.helpers.arrayElement(products).id
            : null,
      });
    }

    // Random discount and GST
    const discount = faker.helpers.weightedArrayElement([
      { value: 0, weight: 0.7 },
      { value: faker.number.float({ min: 50, max: 500, multipleOf: 10 }), weight: 0.3 },
    ]);

    const gst = 10; // Standard 10% GST

    // Create quote data
    const quoteData: Quote = {
      quoteNumber: `QT-2024-${String(i + 1).padStart(4, '0')}`,
      customerId: customer.id,
      status,
      amount: totalAmount,
      currency: 'AUD',
      discount,
      gst,
      issuedDate,
      validUntil,
      notes: faker.helpers.maybe(
        () => faker.lorem.paragraph(),
        { probability: 0.5 },
      ) ?? null,
      terms: faker.helpers.maybe(
        () => 'Payment due within 14 days of acceptance. 50% deposit required to commence work.',
        { probability: 0.7 },
      ) ?? null,
      items: {
        create: items,
      },
    };

    quotes.push(quoteData);
  }

  // Create quotes with items
  let created = 0;
  for (const quoteData of quotes) {
    try {
      const quote = await prisma.quote.create({
        data: quoteData,
      });

      // Create initial status history entry
      await prisma.quoteStatusHistory.create({
        data: {
          quoteId: quote.id,
          status: quote.status,
          previousStatus: null,
          notes: 'Quote created',
        },
      });

      created++;
    } catch (error) {
      console.error(`Failed to create quote:`, error);
    }
  }

  console.log(`✅ Created ${created} quotes`);
}