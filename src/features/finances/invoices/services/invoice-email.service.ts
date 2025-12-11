import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { sendEmailNotification } from '@/lib/email-service';
import { env } from '@/env';
import type { InvoiceWithDetails } from '@/features/finances/invoices/types';
import {
  SendInvoiceEmailSchema,
  SendReceiptEmailSchema,
  SendReminderEmailSchema,
  type SendInvoiceEmailInput,
  type SendReceiptEmailInput,
  type SendReminderEmailInput,
} from '@/schemas/invoices';
import { InvoiceRepository } from '@/repositories/invoice-repository';

const invoiceRepository = new InvoiceRepository(prisma);

/**
 * Get the email recipient, overriding with test email if in test mode
 */
function getEmailRecipient(originalRecipient: string): string {
  if (env.EMAIL_TEST_MODE && env.EMAIL_TEST_RECIPIENT) {
    logger.info('Email test mode enabled - overriding recipient', {
      context: 'invoice-email-service',
      metadata: {
        originalRecipient,
        testRecipient: env.EMAIL_TEST_RECIPIENT,
      },
    });

    return env.EMAIL_TEST_RECIPIENT;
  }
  
  return originalRecipient;
}

/**
 * Process invoice email - generates PDF and sends email
 */
export async function processInvoiceEmail(
  invoiceId: string,
  type: 'pending_notification' | 'receipt' | 'reminder'
): Promise<{ success: true; emailId?: string }> {
  const invoice = await invoiceRepository.findByIdWithDetails(invoiceId);

  if (!invoice) {
    throw new Error('Invoice not found');
  } 

  if (type === 'pending_notification') {
    return await processPendingNotification(invoice);
  } else if (type === 'receipt') {
    return await processReceipt(invoice);
  } else if (type === 'reminder') {
    return await processReminder(invoice);
  }

  throw new Error(`Unknown email type: ${type}`);
}

/**
 * Process pending notification email
 */
async function processPendingNotification(
  invoice: InvoiceWithDetails
): Promise<{ success: true; emailId?: string }> {
  const { getOrGenerateInvoicePdf } = await import(
    '@/features/finances/invoices/services/invoice-pdf.service'
  );

  // 1. Generate PDF
  const { pdfBuffer, pdfUrl, pdfFilename } = await getOrGenerateInvoicePdf(invoice, {
    context: 'inngest_pending_notification',
    skipDownload: false,
  });

  // 2. Prepare Data
  const recipient = getEmailRecipient(invoice.customer.email);
  const emailData: SendInvoiceEmailInput = SendInvoiceEmailSchema.parse({
    invoiceId: invoice.id,
    to: recipient,
    invoiceData: {
      invoiceNumber: invoice.invoiceNumber,
      customerName: `${invoice.customer.firstName} ${invoice.customer.lastName}`,
      amount: invoice.amount,
      currency: invoice.currency,
      dueDate: invoice.dueDate,
      issuedDate: invoice.issuedDate,
    },
    pdfUrl,
  });

  // 3. Send Email
  const result = await sendEmailNotification({
    to: recipient,
    subject: `Invoice ${emailData.invoiceData.invoiceNumber}`,
    template: 'invoice',
    props: {
      invoiceData: emailData.invoiceData,
      pdfUrl,
    },
    attachments: pdfBuffer ? [{ filename: pdfFilename, content: pdfBuffer }] : [],
  });

  logger.info('Pending notification email sent', {
    context: 'invoice-email-service',
    metadata: {
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      emailId: result.emailId,
    },
  });

  return { success: true, emailId: result.emailId };
}

/**
 * Process receipt email
 */
async function processReceipt(
  invoice: InvoiceWithDetails
): Promise<{ success: true; emailId?: string }> {
  const { getOrGenerateReceiptPdf } = await import(
    '@/features/finances/invoices/services/invoice-pdf.service'
  );

  // 1. Generate PDF
  const { pdfBuffer, pdfFilename } = await getOrGenerateReceiptPdf(invoice, {
    context: 'inngest_receipt',
    skipDownload: false,
  });

  // 2. Prepare Data
  const recipient = getEmailRecipient(invoice.customer.email);
  const emailData: SendReceiptEmailInput = SendReceiptEmailSchema.parse({
    invoiceId: invoice.id,
    to: recipient,
    receiptData: {
      invoiceNumber: invoice.invoiceNumber,
      receiptNumber: invoice.receiptNumber,
      customerName: `${invoice.customer.firstName} ${invoice.customer.lastName}`,
      amount: invoice.amount,
      currency: invoice.currency,
      paidDate: invoice.paidDate || new Date(),
      paymentMethod: invoice.paymentMethod || 'Not specified',
    },
  });

  // 3. Send Email
  const result = await sendEmailNotification({
    to: recipient,
    subject: `Payment Receipt ${emailData.receiptData.receiptNumber || emailData.receiptData.invoiceNumber}`,
    template: 'receipt',
    props: {
      receiptData: emailData.receiptData,
    },
    attachments: pdfBuffer ? [{ filename: pdfFilename, content: pdfBuffer }] : [],
  });

  logger.info('Receipt email sent', {
    context: 'invoice-email-service',
    metadata: {
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      receiptNumber: invoice.receiptNumber,
      emailId: result.emailId,
    },
  });

  return { success: true, emailId: result.emailId };
}

/**
 * Process reminder email
 */
async function processReminder(
  invoice: InvoiceWithDetails
): Promise<{ success: true; emailId?: string }> {
  const { getOrGenerateInvoicePdf } = await import(
    '@/features/finances/invoices/services/invoice-pdf.service'
  );

  // Calculate days overdue
  const daysOverdue = Math.max(
    0,
    Math.floor((Date.now() - new Date(invoice.dueDate).getTime()) / (1000 * 60 * 60 * 24))
  );

  // 1. Generate PDF
  const { pdfBuffer, pdfUrl, pdfFilename } = await getOrGenerateInvoicePdf(invoice, {
    context: 'inngest_reminder',
    skipDownload: false,
  });

  // 2. Prepare Data
  const recipient = getEmailRecipient(invoice.customer.email);
  const emailData: SendReminderEmailInput = SendReminderEmailSchema.parse({
    invoiceId: invoice.id,
    to: recipient,
    reminderData: {
      invoiceNumber: invoice.invoiceNumber,
      customerName: `${invoice.customer.firstName} ${invoice.customer.lastName}`,
      amount: invoice.amount,
      currency: invoice.currency,
      dueDate: invoice.dueDate,
      daysOverdue: daysOverdue,
      amountPaid: invoice.amountPaid,
      amountDue: invoice.amountDue,
    },
    pdfUrl,
  });

  // 3. Send Email
  const result = await sendEmailNotification({
    to: recipient,
    subject: `Payment Reminder: Invoice ${emailData.reminderData.invoiceNumber} - ${daysOverdue} Days Overdue`,
    template: 'reminder',
    props: {
      reminderData: emailData.reminderData,
      pdfUrl: emailData.pdfUrl,
    },
    attachments: pdfBuffer ? [{ filename: pdfFilename, content: pdfBuffer }] : [],
  });

  logger.info('Reminder email sent', {
    context: 'invoice-email-service',
    metadata: {
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      daysOverdue,
      emailId: result.emailId,
    },
  });

  return { success: true, emailId: result.emailId };
}
