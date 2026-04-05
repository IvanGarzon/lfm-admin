'use server';

import { prisma } from '@/lib/prisma';
import { QuoteRepository } from '@/repositories/quote-repository';
import { createEmailPreviewFunction } from '@/lib/email-preview-factory';

const quoteRepository = new QuoteRepository(prisma);

export type QuoteEmailType = 'sent' | 'reminder' | 'accepted' | 'rejected' | 'expired' | 'followup';

/**
 * Preview quote email without sending
 *
 * Uses the email preview factory to eliminate duplication with invoice previews
 */
export const previewQuoteEmail = createEmailPreviewFunction<
  Awaited<ReturnType<typeof quoteRepository.findByIdWithDetails>>,
  QuoteEmailType
>({
  entityName: 'Quote',
  fetchEntity: (id, tenantId) => quoteRepository.findByIdWithDetails(id, tenantId),
  getCustomerEmail: (quote) => quote!.customer.email,
  buildEmailConfig: (quote, type, tenantName) => {
    if (!quote) {
      return { error: 'Quote not found' };
    }

    const quoteData = {
      quoteNumber: quote.quoteNumber,
      customerName: `${quote.customer.firstName} ${quote.customer.lastName}`,
      amount: quote.amount,
      currency: quote.currency,
      issuedDate: quote.issuedDate,
      validUntil: quote.validUntil,
      itemCount: quote.items.length,
    };

    switch (type) {
      case 'sent':
        return {
          subject: `Quote ${quoteData.quoteNumber} from ${tenantName}`,
          template: 'quote' as const,
          props: {
            quoteData,
            pdfUrl: '#',
          },
          hasAttachment: true,
          attachmentName: `${quote.quoteNumber}.pdf`,
        };

      case 'reminder': {
        const daysUntilExpiry = Math.max(
          0,
          Math.floor((new Date(quote.validUntil).getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
        );
        return {
          subject: `Reminder: Quote ${quoteData.quoteNumber} expires ${daysUntilExpiry === 0 ? 'today' : `in ${daysUntilExpiry} ${daysUntilExpiry === 1 ? 'day' : 'days'}`}`,
          template: 'quote' as const,
          props: {
            quoteData,
            pdfUrl: '#',
          },
          hasAttachment: true,
          attachmentName: `${quote.quoteNumber}.pdf`,
        };
      }

      case 'accepted':
        return {
          subject: `Quote ${quoteData.quoteNumber} Accepted - Thank You!`,
          template: 'quote' as const,
          props: {
            quoteData,
            pdfUrl: '#',
          },
          hasAttachment: true,
          attachmentName: `${quote.quoteNumber}.pdf`,
        };

      case 'rejected':
        return {
          subject: `Quote ${quoteData.quoteNumber} - We Value Your Feedback`,
          template: 'quote' as const,
          props: {
            quoteData,
            pdfUrl: '#',
          },
          hasAttachment: true,
          attachmentName: `${quote.quoteNumber}.pdf`,
        };

      case 'expired':
        return {
          subject: `Quote ${quoteData.quoteNumber} Has Expired`,
          template: 'quote' as const,
          props: {
            quoteData,
            pdfUrl: '#',
          },
          hasAttachment: false,
        };

      case 'followup':
        return {
          subject: `Following up: Quote ${quoteData.quoteNumber} from ${tenantName}`,
          template: 'quote-followup' as const,
          props: {
            quoteData,
            pdfUrl: '#',
          },
          hasAttachment: true,
          attachmentName: `${quote.quoteNumber}.pdf`,
        };

      default:
        return { error: `Unknown email type: ${type}` };
    }
  },
});
