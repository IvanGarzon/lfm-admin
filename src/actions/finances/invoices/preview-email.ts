'use server';

import { prisma } from '@/lib/prisma';
import { InvoiceRepository } from '@/repositories/invoice-repository';
import { createEmailPreviewFunction } from '@/lib/email-preview-factory';

const invoiceRepository = new InvoiceRepository(prisma);

export type InvoiceEmailType = 'sent' | 'reminder';

/**
 * Preview invoice email without sending
 *
 * Uses the email preview factory to eliminate duplication with quote previews
 */
export const previewInvoiceEmail = createEmailPreviewFunction<
  Awaited<ReturnType<typeof invoiceRepository.findInvoiceMetadataById>>,
  InvoiceEmailType
>({
  entityName: 'Invoice',
  fetchEntity: (id, tenantId) => invoiceRepository.findInvoiceMetadataById(id, tenantId),
  getCustomerEmail: (invoice) => invoice!.customer.email,
  buildEmailConfig: (invoice, type, tenantName) => {
    if (!invoice) {
      return { error: 'Invoice not found' };
    }

    const invoiceData = {
      invoiceNumber: invoice.invoiceNumber,
      customerName: `${invoice.customer.firstName} ${invoice.customer.lastName}`,
      amount: invoice.amount,
      currency: invoice.currency,
      issuedDate: invoice.issuedDate,
      dueDate: invoice.dueDate,
    };

    switch (type) {
      case 'sent':
        return {
          subject: `Invoice ${invoiceData.invoiceNumber} from ${tenantName}`,
          template: 'invoice' as const,
          props: {
            invoiceData,
            pdfUrl: '#',
          },
          hasAttachment: true,
          attachmentName: `${invoice.invoiceNumber}.pdf`,
        };

      case 'reminder': {
        const daysOverdue = Math.max(
          0,
          Math.floor((Date.now() - new Date(invoice.dueDate).getTime()) / (1000 * 60 * 60 * 24)),
        );

        const amountPaid = invoice.amountPaid ?? 0;
        const amountDue = invoice.amount - amountPaid;

        return {
          subject: `Payment Reminder: Invoice ${invoiceData.invoiceNumber} is ${daysOverdue} ${daysOverdue === 1 ? 'day' : 'days'} overdue`,
          template: 'reminder' as const,
          props: {
            reminderData: {
              invoiceNumber: invoiceData.invoiceNumber,
              customerName: invoiceData.customerName,
              amount: invoiceData.amount,
              currency: invoiceData.currency,
              dueDate: invoiceData.dueDate,
              daysOverdue,
              amountPaid: amountPaid > 0 ? amountPaid : undefined,
              amountDue: amountPaid > 0 ? amountDue : undefined,
            },
            pdfUrl: '#',
          },
          hasAttachment: true,
          attachmentName: `${invoice.invoiceNumber}.pdf`,
        };
      }

      default:
        return { error: `Unknown email type: ${type}` };
    }
  },
});
