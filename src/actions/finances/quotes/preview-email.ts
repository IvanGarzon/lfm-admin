'use server';

import { prisma } from '@/lib/prisma';
import { QuoteRepository } from '@/repositories/quote-repository';
import { generateEmailPreview, type EmailPreviewResult } from '@/lib/email-preview';

const quoteRepository = new QuoteRepository(prisma);

export type QuoteEmailType = 'sent' | 'reminder' | 'accepted' | 'rejected' | 'expired' | 'followup';

/**
 * Preview quote email without sending
 */
export async function previewQuoteEmail(
  quoteId: string,
  type: QuoteEmailType,
): Promise<EmailPreviewResult> {
  try {
    const quote = await quoteRepository.findByIdWithDetails(quoteId);

    if (!quote) {
      return {
        success: false,
        error: 'Quote not found',
      };
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

    // Prepare email data based on type
    let subject: string;
    let template: string;
    let hasAttachment: boolean;

    switch (type) {
      case 'sent':
        subject = `Quote ${quoteData.quoteNumber} from Las Flores`;
        template = 'quote';
        hasAttachment = true;
        break;

      case 'reminder': {
        const daysUntilExpiry = Math.max(
          0,
          Math.floor((new Date(quote.validUntil).getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
        );
        subject = `Reminder: Quote ${quoteData.quoteNumber} expires ${daysUntilExpiry === 0 ? 'today' : `in ${daysUntilExpiry} ${daysUntilExpiry === 1 ? 'day' : 'days'}`}`;
        template = 'quote';
        hasAttachment = true;
        break;
      }

      case 'accepted':
        subject = `Quote ${quoteData.quoteNumber} Accepted - Thank You!`;
        template = 'quote';
        hasAttachment = true;
        break;

      case 'rejected':
        subject = `Quote ${quoteData.quoteNumber} - We Value Your Feedback`;
        template = 'quote';
        hasAttachment = true;
        break;

      case 'expired':
        subject = `Quote ${quoteData.quoteNumber} Has Expired`;
        template = 'quote';
        hasAttachment = false;
        break;

      case 'followup':
        subject = `Following up: Quote ${quoteData.quoteNumber} from Las Flores`;
        template = 'quote-followup';
        hasAttachment = true;
        break;

      default:
        return {
          success: false,
          error: `Unknown email type: ${type}`,
        };
    }

    return await generateEmailPreview({
      to: quote.customer.email,
      subject,
      template,
      props: {
        quoteData,
        pdfUrl: '#',
      },
      hasAttachment,
      attachmentName: hasAttachment ? `${quote.quoteNumber}.pdf` : undefined,
    });
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to preview quote email',
    };
  }
}
