import { NextResponse } from 'next/server';
import { env } from '@/env';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { InvoiceStatus } from '@/prisma/client';
import {
  SendInvoiceEmailSchema,
  SendReceiptEmailSchema, 
  SendReminderEmailSchema,
  type SendInvoiceEmailInput,
  type SendReceiptEmailInput,
  type SendReminderEmailInput,
} from '@/schemas/invoices';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Allow 1 minute for PDF generation/sending

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${env.CRON_SECRET}`) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const body = await request.json();
    console.debug(body);
    
    const { invoiceId, type } = body;

    if (!invoiceId || !type) {
      return new NextResponse('Missing invoiceId or type', { status: 400 });
    }

    logger.info(`Starting background email task: ${type}`, {
      context: 'BackgroundJob',
      metadata: { invoiceId },
    });

    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        customer: {
          include: {
            organization: true,
          },
        },
        items: {
          include: {
            product: true,
          },
        },
        payments: true,
      },
    });

    if (!invoice) {
      logger.error('Invoice not found', undefined, { context: 'BackgroundJob', metadata: { invoiceId } });
      return new NextResponse('Invoice not found', { status: 404 });
    }

    // Prepare InvoiceWithDetails object structure required by helpers
    // (Prisma result is close, but we need to ensure types match perfectly if using strict types)
    // The helpers expect numbers for decimals usually.
    const invoiceDetails = {
      ...invoice,
      amount: Number(invoice.amount),
      gst: Number(invoice.gst),
      discount: Number(invoice.discount),
      amountPaid: Number(invoice.amountPaid),
      amountDue: Number(invoice.amountDue),
      notes: invoice.notes || undefined,
      items: invoice.items.map(i => ({ ...i, unitPrice: Number(i.unitPrice), total: Number(i.total) })),
      payments: invoice.payments.map(p => ({ 
        ...p, 
        amount: Number(p.amount), 
        notes: p.notes, // Keep as is from prisma (string | null)
      })),
    };

    // Lazy load heavy dependencies
    const { getOrGenerateInvoicePdf, getOrGenerateReceiptPdf } = await import('@/features/finances/invoices/services/invoice-pdf.service');
    const { sendEmailNotification } = await import('@/lib/email-service');

    if (type === 'pending_notification') {
      // 1. Generate PDF
      const { pdfBuffer, pdfUrl, pdfFilename } = await getOrGenerateInvoicePdf(invoiceDetails, {
        context: 'background_pending_notification',
        skipDownload: false,
      });

      // 2. Prepare Data
      const emailData: SendInvoiceEmailInput = SendInvoiceEmailSchema.parse({
        invoiceId: invoice.id,
        to: invoice.customer.email,
        invoiceData: {
          invoiceNumber: invoice.invoiceNumber,
          customerName: `${invoice.customer.firstName} ${invoice.customer.lastName}`,
          amount: invoiceDetails.amount, // Using number
          currency: invoice.currency,
          dueDate: invoice.dueDate,
          issuedDate: invoice.issuedDate,
        },
        pdfUrl,
      });

      // 3. Send Email
      await sendEmailNotification({
        to: emailData.to,
        subject: `Invoice ${emailData.invoiceData.invoiceNumber}`,
        template: 'invoice',
        props: {
          invoiceData: emailData.invoiceData,
          pdfUrl,
        },
        attachments: pdfBuffer ? [{ filename: pdfFilename, content: pdfBuffer }] : [],
      });

    } else if (type === 'receipt') {
      // 1. Generate PDF
      const { pdfBuffer, pdfFilename } = await getOrGenerateReceiptPdf(invoiceDetails, {
        context: 'background_receipt',
        skipDownload: false,
      });

      // 2. Prepare Data
      const emailData: SendReceiptEmailInput = SendReceiptEmailSchema.parse({
        invoiceId: invoice.id,
        to: invoice.customer.email,
        receiptData: {
            invoiceNumber: invoice.invoiceNumber,
            receiptNumber: invoice.receiptNumber,
            customerName: `${invoice.customer.firstName} ${invoice.customer.lastName}`,
            amount: invoiceDetails.amount,
            currency: invoice.currency,
            paidDate: invoice.paidDate || new Date(),
            paymentMethod: invoice.paymentMethod || 'Not specified',
        }
      });

      // 3. Send Email
      await sendEmailNotification({
        to: emailData.to,
        subject: `Payment Receipt ${emailData.receiptData.receiptNumber || emailData.receiptData.invoiceNumber}`,
        template: 'receipt',
        props: {
          receiptData: emailData.receiptData,
        },
        attachments: pdfBuffer ? [{ filename: pdfFilename, content: pdfBuffer }] : [],
      });
      
    } else if (type === 'reminder') {
       // Logic for reminder...
       // Calculate days overdue
       const daysOverdue = Math.max(0, Math.floor((Date.now() - new Date(invoice.dueDate).getTime()) / (1000 * 60 * 60 * 24)));
       
       const { pdfBuffer, pdfUrl, pdfFilename } = await getOrGenerateInvoicePdf(invoiceDetails, {
        context: 'background_reminder',
        skipDownload: false,
      });

      const emailData: SendReminderEmailInput = SendReminderEmailSchema.parse({
          invoiceId: invoice.id,
          to: invoice.customer.email,
          reminderData: {
            invoiceNumber: invoice.invoiceNumber,
            customerName: `${invoice.customer.firstName} ${invoice.customer.lastName}`,
            amount: invoiceDetails.amount,
            currency: invoice.currency,
            dueDate: invoice.dueDate,
            daysOverdue: daysOverdue,
            amountPaid: invoiceDetails.amountPaid,
            amountDue: invoiceDetails.amountDue,
          },
          pdfUrl,
      });

      await sendEmailNotification({
        to: emailData.to,
        subject: `Payment Reminder: Invoice ${emailData.reminderData.invoiceNumber} - ${daysOverdue} Days Overdue`,
        template: 'reminder',
        props: {
          reminderData: emailData.reminderData,
          pdfUrl: emailData.pdfUrl,
        },
        attachments: pdfBuffer ? [{ filename: pdfFilename, content: pdfBuffer }] : [],
      });

      // Update reminder count
      await prisma.invoice.update({
        where: { id: invoiceId },
        data: { remindersSent: { increment: 1 } }
      });
    }

    logger.info(`Background email task completed: ${type}`, {
      context: 'BackgroundJob',
      metadata: { invoiceId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Background job failed', error, { context: 'BackgroundJob' });
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
