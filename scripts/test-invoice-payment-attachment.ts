/**
 * Test script to verify invoice payment creates transaction attachments
 * Run with: npx tsx scripts/test-invoice-payment-attachment.ts
 */

import 'dotenv/config';
import { prisma } from '@/lib/prisma';
import { InvoiceRepository } from '@/repositories/invoice-repository';
import { InvoiceStatus } from '@/prisma/client';

async function testInvoicePaymentAttachment() {
  console.log('=== Testing Invoice Payment Attachment ===\n');

  const invoiceRepo = new InvoiceRepository(prisma);

  try {
    // 1. Find or create a test invoice
    console.log('1. Looking for a pending invoice...');
    let testInvoice = await prisma.invoice.findFirst({
      where: {
        status: {
          in: [InvoiceStatus.PENDING, InvoiceStatus.OVERDUE, InvoiceStatus.PARTIALLY_PAID],
        },
        deletedAt: null,
      },
      include: {
        customer: true,
      },
    });

    if (!testInvoice) {
      console.log('   ❌ No pending invoice found. Please create one first.');
      return;
    }

    console.log(`   ✅ Found invoice: ${testInvoice.invoiceNumber}`);
    console.log(`   - Amount: ${testInvoice.amount}`);
    console.log(`   - Amount Due: ${testInvoice.amountDue}`);
    console.log(`   - Status: ${testInvoice.status}\n`);

    // 2. Check existing transactions for this invoice
    console.log('2. Checking existing transactions...');
    const existingTransactions = await prisma.transaction.findMany({
      where: { invoiceId: testInvoice.id },
      include: {
        attachments: true,
      },
    });
    console.log(`   Found ${existingTransactions.length} existing transaction(s)\n`);

    // 3. Make a partial payment
    const paymentAmount = Number(testInvoice.amountDue) / 2; // Pay half
    console.log(`3. Making partial payment of ${paymentAmount}...`);

    const result = await invoiceRepo.addPayment(
      testInvoice.id,
      paymentAmount,
      'Test Payment',
      new Date(),
      'Test payment for attachment verification',
      'test-user',
    );

    console.log(`   ✅ Payment recorded successfully`);
    console.log(`   - New status: ${result.status}\n`);

    // 4. Check if transaction was created with attachment
    console.log('4. Verifying transaction and attachment...');
    const newTransactions = await prisma.transaction.findMany({
      where: { invoiceId: testInvoice.id },
      include: {
        attachments: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const latestTransaction = newTransactions[0];
    if (!latestTransaction) {
      console.log('   ❌ No transaction found!');
      return;
    }

    console.log(`   ✅ Transaction created: ${latestTransaction.referenceNumber}`);
    console.log(`   - Attachments: ${latestTransaction.attachments.length}`);

    if (latestTransaction.attachments.length > 0) {
      const attachment = latestTransaction.attachments[0];
      console.log(`   ✅ ATTACHMENT FOUND!`);
      console.log(`      - ID: ${attachment.id}`);
      console.log(`      - File: ${attachment.fileName}`);
      console.log(`      - S3 Key: ${attachment.s3Key}`);
    } else {
      console.log(`   ❌ NO ATTACHMENT CREATED!`);
      console.log('   Check the logs above for errors.');
    }

    // 5. Check if document exists
    console.log('\n5. Checking invoice documents...');
    const documents = await prisma.document.findMany({
      where: { invoiceId: testInvoice.id },
      orderBy: { generatedAt: 'desc' },
    });
    console.log(`   Found ${documents.length} document(s)`);
    documents.forEach((doc) => {
      console.log(`   - ${doc.kind}: ${doc.fileName} (${doc.s3Key})`);
    });

    console.log('\n=== Test Complete ===');
  } catch (error) {
    console.error('Test failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

testInvoicePaymentAttachment();
