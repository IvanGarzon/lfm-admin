/**
 * Inngest Function: Send Email
 *
 * Generic background function that processes all email types:
 * - Invoices (pending, reminder, receipt, overdue)
 * - Quotes (sent, reminder, accepted, rejected, expired)
 * - Reports (monthly, weekly, custom)
 * - Customer notifications
 */

import { inngest } from '@/lib/inngest/client';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { processInvoiceEmail } from '@/features/finances/invoices/services/invoice-email.service';
import { processQuoteEmail } from '@/features/finances/quotes/services/quote-email.service';
import { EmailAuditRepository } from '@/repositories/email-audit-repository';
import type { QueueEmailPayload } from '@/types/email';

const emailAuditRepo = new EmailAuditRepository(prisma);

export const sendEmailFunction = inngest.createFunction(
  {
    id: 'send-email',
    name: 'Send Email',
    retries: 3,
    concurrency: {
      limit: 10,
    },
    timeouts: {
      finish: '5m',
    },
    triggers: [{ event: 'email/send' }, { event: 'send-email/manual' }],
  },
  async ({ event, step }) => {
    const { auditId, email } = event.data as { auditId: string; email: QueueEmailPayload };

    logger.info('Inngest function triggered - processing email', {
      context: 'inngest-send-email',
      metadata: {
        auditId,
        emailType: email.emailType,
        entityType: email.entityType,
        entityId: email.entityId,
        recipient: email.recipient,
      },
    });

    // Idempotency check: Skip if email was already sent
    const existingAudit = await step.run('check-idempotency', async () => {
      return emailAuditRepo.findStatusById(auditId);
    });

    if (existingAudit?.status === 'SENT') {
      logger.info('Email already sent - skipping (idempotency check)', {
        context: 'inngest-send-email',
        metadata: {
          auditId,
          sentAt: existingAudit.sentAt,
        },
      });
      return { success: true, skipped: true, reason: 'already_sent' };
    }

    await step.run('update-status-sending', async () => {
      await emailAuditRepo.markAsSending(auditId, event.id);
    });

    // Step 2: Process email based on entity type
    try {
      const result = await step.run('send-email', async () => {
        // Route to appropriate processor based on entity type
        if (email.entityType === 'invoice') {
          if (!isInvoiceEmailType(email.emailType)) {
            throw new Error(`Invalid email type for invoice: ${email.emailType}`);
          }
          return await processInvoiceEmailHandler(email.entityId, email.emailType, email.tenantId);
        } else if (email.entityType === 'quote') {
          if (!isQuoteEmailType(email.emailType)) {
            throw new Error(`Invalid email type for quote: ${email.emailType}`);
          }
          return await processQuoteEmailHandler(email.entityId, email.emailType, email.tenantId);
        } else {
          throw new Error(`Unknown entity type: ${email.entityType}`);
        }
      });

      await step.run('update-status-sent', async () => {
        await emailAuditRepo.markAsSent(auditId, result.emailId, email.metadata ?? {});
      });

      logger.info('Email sent successfully', {
        context: 'inngest-send-email',
        metadata: {
          auditId,
          emailType: email.emailType,
          emailId: result.emailId,
        },
      });

      return { success: true, emailId: result.emailId };
    } catch (error) {
      await step.run('update-status-failed', async () => {
        await emailAuditRepo.markAsFailed(
          auditId,
          error instanceof Error ? error.message : 'Unknown error',
        );
      });

      logger.error('Email sending failed', error, {
        context: 'inngest-send-email',
        metadata: {
          auditId,
          emailType: email.emailType,
        },
      });

      throw error;
    }
  },
);

type InvoiceEmailType =
  | 'invoice.pending'
  | 'invoice.reminder'
  | 'invoice.receipt'
  | 'invoice.overdue';
type QuoteEmailType =
  | 'quote.sent'
  | 'quote.reminder'
  | 'quote.accepted'
  | 'quote.rejected'
  | 'quote.expired';

const invoiceEmailTypes: readonly InvoiceEmailType[] = [
  'invoice.pending',
  'invoice.reminder',
  'invoice.receipt',
  'invoice.overdue',
];

const quoteEmailTypes: readonly QuoteEmailType[] = [
  'quote.sent',
  'quote.reminder',
  'quote.accepted',
  'quote.rejected',
  'quote.expired',
];

function isInvoiceEmailType(type: string): type is InvoiceEmailType {
  return (invoiceEmailTypes as readonly string[]).includes(type);
}

function isQuoteEmailType(type: string): type is QuoteEmailType {
  return (quoteEmailTypes as readonly string[]).includes(type);
}

/**
 * Process invoice emails
 */
async function processInvoiceEmailHandler(
  entityId: string,
  emailType: InvoiceEmailType,
  tenantId: string,
): Promise<{ emailId?: string }> {
  const typeMapping: Record<InvoiceEmailType, 'pending_notification' | 'receipt' | 'reminder'> = {
    'invoice.pending': 'pending_notification',
    'invoice.receipt': 'receipt',
    'invoice.reminder': 'reminder',
    'invoice.overdue': 'reminder',
  };

  return await processInvoiceEmail(entityId, typeMapping[emailType], tenantId);
}

/**
 * Process quote emails
 */
async function processQuoteEmailHandler(
  entityId: string,
  emailType: QuoteEmailType,
  tenantId: string,
): Promise<{ emailId?: string }> {
  const typeMapping: Record<
    QuoteEmailType,
    'sent' | 'reminder' | 'accepted' | 'rejected' | 'expired'
  > = {
    'quote.sent': 'sent',
    'quote.reminder': 'reminder',
    'quote.accepted': 'accepted',
    'quote.rejected': 'rejected',
    'quote.expired': 'expired',
  };

  return await processQuoteEmail(entityId, typeMapping[emailType], tenantId);
}
