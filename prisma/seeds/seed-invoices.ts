import { prisma } from '@/lib/prisma';
import { InvoiceStatus } from '@/prisma/client';
import { faker } from '@faker-js/faker';

interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  productId: string | null;
}

interface Invoice {
  invoiceNumber: string;
  customerId: string;
  status: InvoiceStatus;
  amount: number;
  currency: string;
  discount: number;
  gst: number;
  issuedDate: Date;
  dueDate: Date;
  notes: string | null | undefined;
  items: {
    create: InvoiceItem[];
  };
  remindersSent?: number;
  paidDate?: Date;
  paymentMethod?: string;
  receiptNumber?: string;
  cancelledDate?: Date;
  cancelReason?: string;
}

/**
 * Seed Invoice Data
 * Generates fake invoices with items for testing
 */

export async function seedInvoices() {
  console.log('🌱 Seeding invoices...');

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

  const statuses: InvoiceStatus[] = ['DRAFT', 'PENDING', 'PAID', 'CANCELLED', 'OVERDUE'];
  const paymentMethods = ['Bank Transfer', 'Credit Card', 'PayPal', 'Cash', 'Cheque'];
  const cancelReasons = [
    'Client Request',
    'Duplicate Invoice',
    'Service Not Delivered',
    'Pricing Error',
    'Contract Cancelled',
  ];

  const invoices: Invoice[] = [];

  for (let i = 0; i < 60; i++) {
    const customer = faker.helpers.arrayElement(customers);
    const status = faker.helpers.arrayElement(statuses);
    const issuedDate = faker.date.between({
      from: new Date(2025, 0, 1),
      to: new Date(),
    });

    const dueDate = new Date(issuedDate);
    dueDate.setDate(dueDate.getDate() + faker.number.int({ min: 14, max: 90 }));

    // Generate items
    const itemCount = faker.number.int({ min: 1, max: 5 });
    const items: InvoiceItem[] = [];
    let totalAmount = 0;

    for (let j = 0; j < itemCount; j++) {
      const quantity = faker.number.int({ min: 1, max: 10 });
      const unitPrice = faker.number.float({ min: 50, max: 5000, multipleOf: 0.01 });
      const total = quantity * unitPrice;
      totalAmount += total;

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
        total,
        productId:
          products.length > 0 && faker.datatype.boolean({ probability: 0.5 })
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

    // Create invoice data based on status
    const invoiceData: Invoice = {
      invoiceNumber: `INV-2025-${String(i + 1).padStart(4, '0')}`,
      customerId: customer.id,
      status,
      amount: totalAmount,
      currency: 'AUD',
      discount,
      gst,
      issuedDate,
      dueDate,
      notes: faker.helpers.maybe(
        () => faker.lorem.sentence(),
        { probability: 0.3 },
      ),
      items: {
        create: items,
      },
    };

    // Add status-specific fields
    if (status === 'PENDING' || status === 'OVERDUE') {
      invoiceData.remindersSent = faker.number.int({ min: 0, max: 3 });
    } else if (status === 'PAID') {
      const paidDate = faker.date.between({
        from: issuedDate,
        to: dueDate,
      });
      invoiceData.paidDate = paidDate;
      invoiceData.paymentMethod = faker.helpers.arrayElement(paymentMethods);
      // Add receipt number for paid invoices
      invoiceData.receiptNumber = `RCP-2024-${String(i + 1).padStart(4, '0')}`;      
    } else if (status === 'CANCELLED') {
      const cancelledDate = faker.date.between({
        from: issuedDate,
        to: new Date(),
      });
      invoiceData.cancelledDate = cancelledDate;
      invoiceData.cancelReason = faker.helpers.arrayElement(cancelReasons);
    }

    invoices.push(invoiceData);
  }

  // Create invoices with items in transaction
  let created = 0;
  for (const invoiceData of invoices) {
    try {
      await prisma.invoice.create({
        data: invoiceData,
      });
      created++;
    } catch (error) {
      console.error(`Failed to create invoice:`, error);
    }
  }

  console.log(`✅ Created ${created} invoices`);
}