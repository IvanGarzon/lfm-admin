import { PrismaClient, InvoiceStatus } from '@/prisma/client';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

/**
 * Seed Invoice Data
 * Generates fake invoices with items for testing
 */

async function seedInvoices() {
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

  const statuses: InvoiceStatus[] = ['PENDING', 'PAID', 'CANCELLED', 'OVERDUE'];
  const paymentMethods = ['Bank Transfer', 'Credit Card', 'PayPal', 'Cash', 'Cheque'];
  const cancelReasons = [
    'Client Request',
    'Duplicate Invoice',
    'Service Not Delivered',
    'Pricing Error',
    'Contract Cancelled',
  ];

  const invoices = [];

  for (let i = 0; i < 50; i++) {
    const customer = faker.helpers.arrayElement(customers);
    const status = faker.helpers.arrayElement(statuses);
    const issuedDate = faker.date.between({
      from: new Date(2024, 0, 1),
      to: new Date(),
    });
    const dueDate = new Date(issuedDate);
    dueDate.setDate(dueDate.getDate() + faker.number.int({ min: 14, max: 90 }));

    // Generate items
    const itemCount = faker.number.int({ min: 1, max: 5 });
    const items = [];
    let totalAmount = 0;

    for (let j = 0; j < itemCount; j++) {
      const quantity = faker.number.int({ min: 1, max: 10 });
      const unitPrice = faker.number.float({ min: 50, max: 5000, multipleOf: 0.01 });
      const total = quantity * unitPrice;
      totalAmount += total;

      items.push({
        description: faker.commerce.productName(),
        quantity,
        unitPrice,
        total,
        productId:
          products.length > 0 && faker.datatype.boolean()
            ? faker.helpers.arrayElement(products).id
            : null,
      });
    }

    // Create invoice data based on status
    const invoiceData: Record<string, unknown> = {
      invoiceNumber: `INV-2024-${String(i + 1).padStart(4, '0')}`,
      customerId: customer.id,
      status,
      amount: totalAmount,
      currency: 'AUD',
      issuedDate,
      dueDate,
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

async function main() {
  try {
    await seedInvoices();
    console.log('🎉 Invoice seeding completed!');
  } catch (error) {
    console.error('❌ Error seeding invoices:', error);
    throw error;
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
