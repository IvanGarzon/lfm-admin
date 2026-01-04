import { prisma } from '@/lib/prisma';
import { InvoiceStatus, TransactionType, TransactionStatus } from '@/prisma/client';
import { faker } from '@faker-js/faker';
import { InvoiceRepository } from '@/repositories/invoice-repository';

/**
 * Seed Invoice Data
 * Generates fake invoices with items and follows the lifecycle flow
 */

export async function seedInvoices() {
  console.log('🌱 Seeding invoices with lifecycle history...');

  // Initialize invoice repository
  const invoiceRepository = new InvoiceRepository(prisma);

  // Get existing customers
  const customers = await prisma.customer.findMany({
    take: 20,
  });

  if (customers.length === 0) {
    console.log('⚠️  No customers found. Please seed customers first.');
    return;
  }

  // Get existing products (optional)
  const products = await prisma.product.findMany({
    take: 10,
  });

  const paymentMethods = ['Bank Transfer', 'Credit Card', 'PayPal', 'Cash', 'Cheque'];

  const createdStandaloneIds: string[] = [];

  // 1. Create 50 standalone DRAFT invoices
  for (let i = 0; i < 50; i++) {
    const customer = faker.helpers.arrayElement(customers);
    const issuedDate = faker.date.between({
      from: new Date(2025, 0, 1),
      to: new Date(),
    });

    const dueDate = new Date(issuedDate);
    dueDate.setDate(dueDate.getDate() + faker.number.int({ min: 14, max: 90 }));

    // Generate items
    const itemCount = faker.number.int({ min: 1, max: 5 });
    const items: any[] = [];

    for (let j = 0; j < itemCount; j++) {
      const quantity = faker.number.int({ min: 1, max: 10 });
      const unitPrice = faker.number.float({ min: 50, max: 5000, multipleOf: 0.5 });

      items.push({
        description: faker.helpers.arrayElement([
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
          'Arrangement for funeral',
        ]),
        quantity,
        unitPrice,
        productId:
          products.length > 0 && faker.datatype.boolean({ probability: 0.5 })
            ? faker.helpers.arrayElement(products).id
            : null,
      });
    }

    try {
      // Create as DRAFT via repository to get initial history
      const { id } = await invoiceRepository.createInvoiceWithItems({
        customerId: customer.id,
        status: InvoiceStatus.DRAFT,
        currency: 'AUD',
        discount: faker.helpers.weightedArrayElement([
          { value: 0, weight: 0.7 },
          { value: faker.number.float({ min: 50, max: 500, multipleOf: 10 }), weight: 0.3 },
        ]),
        gst: 10,
        issuedDate,
        dueDate,
        items,
        notes: faker.helpers.maybe(() => faker.lorem.sentence(), { probability: 0.3 }) ?? undefined,
      });
      createdStandaloneIds.push(id);
    } catch (error) {
      console.error(`Failed to create standalone invoice:`, error);
    }
  }

  console.log(`✅ Created ${createdStandaloneIds.length} standalone DRAFT invoices.`);

  // 2. Fetch all non-DRAFT invoices (likely from Quote conversion) plus some standalone DRAFTs
  const allProcessableInvoices = await prisma.invoice.findMany({
    where: {
      status: { in: [InvoiceStatus.DRAFT, InvoiceStatus.PENDING] },
      deletedAt: null,
    },
    select: { id: true, status: true, amount: true, issuedDate: true },
  });

  console.log(`Processing transitions for ${allProcessableInvoices.length} invoices...`);

  // 3. Move most DRAFTs to PENDING
  for (const inv of allProcessableInvoices) {
    if (inv.status === InvoiceStatus.DRAFT && faker.datatype.boolean({ probability: 0.8 })) {
      try {
        await invoiceRepository.markAsPending(inv.id);
      } catch (e) {}
    }
  }

  // 4. Record payments for some PENDING invoices (making them PAID or PARTIALLY_PAID)
  const pendingInvoices = await prisma.invoice.findMany({
    where: { status: InvoiceStatus.PENDING, deletedAt: null },
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
      const method = faker.helpers.arrayElement(paymentMethods);

      await invoiceRepository.addPayment(
        inv.id,
        amountToPay,
        method,
        payDate,
        isPartial ? 'Partial payment received' : 'Full payment received',
      );

      // If partial, maybe pay the rest
      if (isPartial && faker.datatype.boolean({ probability: 0.5 })) {
        await invoiceRepository.addPayment(
          inv.id,
          amountToPay, // Remaining half
          method,
          new Date(payDate.getTime() + 86400000), // Day after
          'Final payment',
        );
      }
    } catch (e) {
      console.error(`Failed to record payment for invoice ${inv.id}:`, e);
    }
  }

  // 5. Some PENDING move to CANCELLED or OVERDUE
  const remainingInvoices = await prisma.invoice.findMany({
    where: { status: InvoiceStatus.PENDING, deletedAt: null },
    select: { id: true, issuedDate: true },
  });

  for (const inv of remainingInvoices) {
    const action = faker.helpers.weightedArrayElement([
      { value: 'CANCEL', weight: 0.1 },
      { value: 'OVERDUE', weight: 0.2 },
      { value: 'KEEP', weight: 0.7 },
    ]);

    try {
      if (action === 'CANCEL') {
        await invoiceRepository.cancel(
          inv.id,
          new Date(),
          faker.helpers.arrayElement(['Client Request', 'Duplicate Invoice', 'Pricing Error']),
        );
      } else if (action === 'OVERDUE') {
        // Manually set to overdue to simulate background job
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
    } catch (e) {}
  }

  console.log(`✅ Invoice transitions completed.`);
}
