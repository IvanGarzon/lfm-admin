/**
 * Data validation script - Run before applying check constraints
 * Usage: npx tsx scripts/validate-data.ts
 */

import 'dotenv/config';
import { prisma } from '../src/lib/prisma';

async function validateData() {
  console.log('🔍 Validating data before applying constraints...\n');

  try {
    // Quote validations
    const invalidQuoteAmounts = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*) as count FROM quotes
      WHERE amount < 0 OR gst < 0 OR discount < 0
    `;

    const invalidQuoteGST = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*) as count FROM quotes
      WHERE gst < 0 OR gst > 100
    `;

    const invalidQuoteDates = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*) as count FROM quotes
      WHERE valid_until < issued_date
    `;

    // QuoteItem validations
    const invalidQuoteItems = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*) as count FROM quote_items
      WHERE quantity <= 0 OR unit_price < 0 OR total < 0
    `;

    // Invoice validations
    const invalidInvoiceAmounts = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*) as count FROM invoices
      WHERE amount < 0 OR gst < 0 OR discount < 0
    `;

    const invalidInvoiceGST = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*) as count FROM invoices
      WHERE gst < 0 OR gst > 100
    `;

    const invalidInvoiceDates = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*) as count FROM invoices
      WHERE due_date < issued_date
    `;

    const invalidInvoicePaid = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*) as count FROM invoices
      WHERE amount_paid > amount
    `;

    // InvoiceItem validations
    const invalidInvoiceItems = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*) as count FROM invoice_items
      WHERE quantity <= 0 OR unit_price < 0 OR total < 0
    `;

    // Payment validations
    const invalidPayments = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*) as count FROM payments
      WHERE amount <= 0
    `;

    console.log('📋 Validation Results:');
    console.log('='.repeat(70));
    console.log(`Quotes - Negative amounts:        ${invalidQuoteAmounts[0].count}`);
    console.log(`Quotes - Invalid GST percentage:  ${invalidQuoteGST[0].count}`);
    console.log(`Quotes - Invalid date ranges:     ${invalidQuoteDates[0].count}`);
    console.log(`Quote Items - Invalid values:     ${invalidQuoteItems[0].count}`);
    console.log(`Invoices - Negative amounts:      ${invalidInvoiceAmounts[0].count}`);
    console.log(`Invoices - Invalid GST percentage: ${invalidInvoiceGST[0].count}`);
    console.log(`Invoices - Invalid date ranges:   ${invalidInvoiceDates[0].count}`);
    console.log(`Invoices - Overpaid:              ${invalidInvoicePaid[0].count}`);
    console.log(`Invoice Items - Invalid values:   ${invalidInvoiceItems[0].count}`);
    console.log(`Payments - Invalid amounts:       ${invalidPayments[0].count}`);
    console.log('='.repeat(70));

    const totalIssues =
      Number(invalidQuoteAmounts[0].count) +
      Number(invalidQuoteGST[0].count) +
      Number(invalidQuoteDates[0].count) +
      Number(invalidQuoteItems[0].count) +
      Number(invalidInvoiceAmounts[0].count) +
      Number(invalidInvoiceGST[0].count) +
      Number(invalidInvoiceDates[0].count) +
      Number(invalidInvoicePaid[0].count) +
      Number(invalidInvoiceItems[0].count) +
      Number(invalidPayments[0].count);

    if (totalIssues === 0) {
      console.log('\n✅ All data is valid! Ready to apply constraints.\n');
      process.exit(0);
    } else {
      console.log(`\n⚠️  Found ${totalIssues} data integrity issues.\n`);
      console.log('❌ Please fix invalid data before applying constraints.\n');
      console.log('Run the SQL queries in scripts/validate-data-before-constraints.sql');
      console.log('to see the specific records that need fixing.\n');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Validation failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run validation
validateData().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
