import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { sendEmailNotification } from '@/lib/email-service';
import { env } from '@/env';
import type { QuoteWithDetails } from '@/features/finances/quotes/types';
import { QuoteRepository } from '@/repositories/quote-repository';
import { getTenantBrandingById } from '@/actions/tenant/queries';

const quoteRepository = new QuoteRepository(prisma);

/**
 * Get the email recipient, overriding with test email if in test mode
 */
function getEmailRecipient(originalRecipient: string): string {
  if (env.EMAIL_TEST_MODE && env.EMAIL_TEST_RECIPIENT) {
    logger.info('Email test mode enabled - overriding recipient', {
      context: 'quote-email-service',
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
 * Process quote email - generates PDF and sends email
 */
export async function processQuoteEmail(
  quoteId: string,
  type: 'sent' | 'reminder' | 'accepted' | 'rejected' | 'expired' | 'followup',
  tenantId: string,
): Promise<{ success: true; emailId?: string }> {
  const quote = await quoteRepository.findByIdWithDetails(quoteId, tenantId);

  if (!quote) {
    throw new Error('Quote not found');
  }

  if (type === 'sent') {
    return await processSentNotification(quote, tenantId);
  } else if (type === 'reminder') {
    return await processReminder(quote, tenantId);
  } else if (type === 'accepted') {
    return await processAccepted(quote, tenantId);
  } else if (type === 'rejected') {
    return await processRejected(quote, tenantId);
  } else if (type === 'expired') {
    return await processExpired(quote, tenantId);
  } else if (type === 'followup') {
    return await processFollowUp(quote, tenantId);
  }

  throw new Error(`Unknown email type: ${type}`);
}

/**
 * Process sent notification email (when quote is marked as SENT)
 */
async function processSentNotification(
  quote: QuoteWithDetails,
  tenantId: string,
): Promise<{ success: true; emailId?: string }> {
  const { getOrGenerateQuotePdf } =
    await import('@/features/finances/quotes/services/quote-pdf.service');

  const [{ pdfBuffer, pdfUrl, pdfFilename }, branding] = await Promise.all([
    getOrGenerateQuotePdf(quote, {
      context: 'inngest_sent_notification',
      skipDownload: false,
    }),
    getTenantBrandingById(tenantId),
  ]);

  const tenantName = branding?.name ?? '';
  const recipient = getEmailRecipient(quote.customer.email);
  const quoteData = {
    quoteNumber: quote.quoteNumber,
    customerName: `${quote.customer.firstName} ${quote.customer.lastName}`,
    amount: quote.amount,
    currency: quote.currency,
    issuedDate: quote.issuedDate,
    validUntil: quote.validUntil,
    itemCount: quote.items.length,
  };

  const result = await sendEmailNotification({
    to: recipient,
    subject: `Quote ${quoteData.quoteNumber} from ${tenantName}`,
    template: 'quote',
    props: {
      quoteData,
      pdfUrl,
    },
    attachments: pdfBuffer ? [{ filename: pdfFilename, content: pdfBuffer }] : [],
  });

  logger.info('Sent notification email sent', {
    context: 'quote-email-service',
    metadata: {
      quoteId: quote.id,
      quoteNumber: quote.quoteNumber,
      emailId: result.emailId,
    },
  });

  return { success: true, emailId: result.emailId };
}

/**
 * Process reminder email (quote expiring soon)
 */
async function processReminder(
  quote: QuoteWithDetails,
  tenantId: string,
): Promise<{ success: true; emailId?: string }> {
  const { getOrGenerateQuotePdf } =
    await import('@/features/finances/quotes/services/quote-pdf.service');

  const daysUntilExpiry = Math.max(
    0,
    Math.floor((new Date(quote.validUntil).getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
  );

  const [{ pdfBuffer, pdfUrl, pdfFilename }] = await Promise.all([
    getOrGenerateQuotePdf(quote, {
      context: 'inngest_reminder',
      skipDownload: false,
    }),
  ]);

  const recipient = getEmailRecipient(quote.customer.email);
  const quoteData = {
    quoteNumber: quote.quoteNumber,
    customerName: `${quote.customer.firstName} ${quote.customer.lastName}`,
    amount: quote.amount,
    currency: quote.currency,
    issuedDate: quote.issuedDate,
    validUntil: quote.validUntil,
    itemCount: quote.items.length,
  };

  const result = await sendEmailNotification({
    to: recipient,
    subject: `Reminder: Quote ${quoteData.quoteNumber} expires ${daysUntilExpiry === 0 ? 'today' : `in ${daysUntilExpiry} ${daysUntilExpiry === 1 ? 'day' : 'days'}`}`,
    template: 'quote',
    props: {
      quoteData,
      pdfUrl,
    },
    attachments: pdfBuffer ? [{ filename: pdfFilename, content: pdfBuffer }] : [],
  });

  logger.info('Reminder email sent', {
    context: 'quote-email-service',
    metadata: {
      quoteId: quote.id,
      quoteNumber: quote.quoteNumber,
      daysUntilExpiry,
      emailId: result.emailId,
    },
  });

  return { success: true, emailId: result.emailId };
}

/**
 * Process accepted confirmation email
 */
async function processAccepted(
  quote: QuoteWithDetails,
  tenantId: string,
): Promise<{ success: true; emailId?: string }> {
  const { getOrGenerateQuotePdf } =
    await import('@/features/finances/quotes/services/quote-pdf.service');

  const { pdfBuffer, pdfUrl, pdfFilename } = await getOrGenerateQuotePdf(quote, {
    context: 'inngest_accepted',
    skipDownload: false,
  });

  const recipient = getEmailRecipient(quote.customer.email);
  const quoteData = {
    quoteNumber: quote.quoteNumber,
    customerName: `${quote.customer.firstName} ${quote.customer.lastName}`,
    amount: quote.amount,
    currency: quote.currency,
    issuedDate: quote.issuedDate,
    validUntil: quote.validUntil,
    itemCount: quote.items.length,
  };

  const result = await sendEmailNotification({
    to: recipient,
    subject: `Quote ${quoteData.quoteNumber} Accepted - Thank You!`,
    template: 'quote',
    props: {
      quoteData,
      pdfUrl,
    },
    attachments: pdfBuffer ? [{ filename: pdfFilename, content: pdfBuffer }] : [],
  });

  logger.info('Accepted confirmation email sent', {
    context: 'quote-email-service',
    metadata: {
      quoteId: quote.id,
      quoteNumber: quote.quoteNumber,
      emailId: result.emailId,
    },
  });

  return { success: true, emailId: result.emailId };
}

/**
 * Process rejected notification email
 */
async function processRejected(
  quote: QuoteWithDetails,
  tenantId: string,
): Promise<{ success: true; emailId?: string }> {
  const { getOrGenerateQuotePdf } =
    await import('@/features/finances/quotes/services/quote-pdf.service');

  const { pdfBuffer, pdfUrl, pdfFilename } = await getOrGenerateQuotePdf(quote, {
    context: 'inngest_rejected',
    skipDownload: false,
  });

  const recipient = getEmailRecipient(quote.customer.email);
  const quoteData = {
    quoteNumber: quote.quoteNumber,
    customerName: `${quote.customer.firstName} ${quote.customer.lastName}`,
    amount: quote.amount,
    currency: quote.currency,
    issuedDate: quote.issuedDate,
    validUntil: quote.validUntil,
    itemCount: quote.items.length,
  };

  const result = await sendEmailNotification({
    to: recipient,
    subject: `Quote ${quoteData.quoteNumber} - We Value Your Feedback`,
    template: 'quote',
    props: {
      quoteData,
      pdfUrl,
    },
    attachments: pdfBuffer ? [{ filename: pdfFilename, content: pdfBuffer }] : [],
  });

  logger.info('Rejected notification email sent', {
    context: 'quote-email-service',
    metadata: {
      quoteId: quote.id,
      quoteNumber: quote.quoteNumber,
      emailId: result.emailId,
    },
  });

  return { success: true, emailId: result.emailId };
}

/**
 * Process expired notification email
 */
async function processExpired(
  quote: QuoteWithDetails,
  tenantId: string,
): Promise<{ success: true; emailId?: string }> {
  const { getOrGenerateQuotePdf } =
    await import('@/features/finances/quotes/services/quote-pdf.service');

  const { pdfUrl } = await getOrGenerateQuotePdf(quote, {
    context: 'inngest_expired',
    skipDownload: true,
  });

  const recipient = getEmailRecipient(quote.customer.email);
  const quoteData = {
    quoteNumber: quote.quoteNumber,
    customerName: `${quote.customer.firstName} ${quote.customer.lastName}`,
    amount: quote.amount,
    currency: quote.currency,
    issuedDate: quote.issuedDate,
    validUntil: quote.validUntil,
    itemCount: quote.items.length,
  };

  const result = await sendEmailNotification({
    to: recipient,
    subject: `Quote ${quoteData.quoteNumber} Has Expired`,
    template: 'quote',
    props: {
      quoteData,
      pdfUrl,
    },
    attachments: [],
  });

  logger.info('Expired notification email sent', {
    context: 'quote-email-service',
    metadata: {
      quoteId: quote.id,
      quoteNumber: quote.quoteNumber,
      emailId: result.emailId,
    },
  });

  return { success: true, emailId: result.emailId };
}

/**
 * Process follow-up email (manual follow-up with customer)
 */
async function processFollowUp(
  quote: QuoteWithDetails,
  tenantId: string,
): Promise<{ success: true; emailId?: string }> {
  const { getOrGenerateQuotePdf } =
    await import('@/features/finances/quotes/services/quote-pdf.service');

  const [{ pdfBuffer, pdfUrl, pdfFilename }, branding] = await Promise.all([
    getOrGenerateQuotePdf(quote, {
      context: 'inngest_followup',
      skipDownload: false,
    }),
    getTenantBrandingById(tenantId),
  ]);

  const tenantName = branding?.name ?? '';
  const recipient = getEmailRecipient(quote.customer.email);
  const quoteData = {
    quoteNumber: quote.quoteNumber,
    customerName: `${quote.customer.firstName} ${quote.customer.lastName}`,
    amount: quote.amount,
    currency: quote.currency,
    issuedDate: quote.issuedDate,
    validUntil: quote.validUntil,
    itemCount: quote.items.length,
  };

  const result = await sendEmailNotification({
    to: recipient,
    subject: `Following up: Quote ${quoteData.quoteNumber} from ${tenantName}`,
    template: 'quote-followup',
    props: {
      quoteData,
      pdfUrl,
    },
    attachments: pdfBuffer ? [{ filename: pdfFilename, content: pdfBuffer }] : [],
  });

  logger.info('Follow-up email sent', {
    context: 'quote-email-service',
    metadata: {
      quoteId: quote.id,
      quoteNumber: quote.quoteNumber,
      emailId: result.emailId,
    },
  });

  return { success: true, emailId: result.emailId };
}
