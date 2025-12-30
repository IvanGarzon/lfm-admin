/**
 * Fix data integrity issues found by validation
 * Usage: npx tsx scripts/fix-data-issues.ts
 */

import 'dotenv/config';
import { prisma } from '../src/lib/prisma';

async function fixDataIssues() {
  console.log('🔧 Identifying and fixing data integrity issues...\n');

  try {
    // Find invoices with invalid date ranges
    console.log('1️⃣  Checking for invoices with due_date < issued_date...');
    const invalidDateInvoices = await prisma.$queryRaw<
      Array<{
        id: string;
        invoice_number: string;
        issued_date: Date;
        due_date: Date;
      }>
    >`
      SELECT id, invoice_number, issued_date, due_date
      FROM invoices
      WHERE due_date < issued_date
    `;

    if (invalidDateInvoices.length > 0) {
      console.log(`   Found ${invalidDateInvoices.length} invoice(s) with invalid dates:`);
      invalidDateInvoices.forEach((inv) => {
        console.log(
          `   - ${inv.invoice_number}: issued=${inv.issued_date.toISOString().split('T')[0]}, due=${inv.due_date.toISOString().split('T')[0]}`,
        );
      });

      // Fix: Set due_date = issued_date for these invoices
      console.log('   Fixing: Setting due_date = issued_date...');
      for (const inv of invalidDateInvoices) {
        await prisma.invoice.update({
          where: { id: inv.id },
          data: { dueDate: inv.issued_date },
        });
      }
      console.log('   ✅ Fixed invalid date ranges\n');
    } else {
      console.log('   ✅ No invalid date ranges found\n');
    }

    // Find invoices that are overpaid
    console.log('2️⃣  Checking for overpaid invoices (amount_paid > amount)...');
    const overpaidInvoices = await prisma.$queryRaw<
      Array<{
        id: string;
        invoice_number: string;
        amount: number;
        amount_paid: number;
      }>
    >`
      SELECT id, invoice_number, amount, amount_paid
      FROM invoices
      WHERE amount_paid > amount
    `;

    if (overpaidInvoices.length > 0) {
      console.log(`   Found ${overpaidInvoices.length} overpaid invoice(s):`);
      overpaidInvoices.forEach((inv) => {
        console.log(`   - ${inv.invoice_number}: amount=${inv.amount}, paid=${inv.amount_paid}`);
      });

      // Fix: Set amount_paid = amount for these invoices
      console.log('   Fixing: Setting amount_paid = amount...');
      for (const inv of overpaidInvoices) {
        await prisma.invoice.update({
          where: { id: inv.id },
          data: { amountPaid: inv.amount },
        });
      }
      console.log('   ✅ Fixed overpaid invoices\n');
    } else {
      console.log('   ✅ No overpaid invoices found\n');
    }

    console.log('✅ All data integrity issues fixed!\n');
    console.log('💡 Next step: Run validation again to confirm:');
    console.log('   npx tsx scripts/validate-data.ts\n');
  } catch (error) {
    console.error('❌ Fix failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run fixes
fixDataIssues().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
