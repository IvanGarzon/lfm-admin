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
import type { QueueEmailPayload } from '@/types/email';

export const sendEmailFunction = inngest.createFunction(
  {
    id: 'send-email',
    name: 'Send Email',
    retries: 3, // Auto-retry failed emails up to 3 times
    concurrency: {
      limit: 10, // Process up to 10 emails concurrently
    },
  },
  { event: 'email/send' },
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

    // Step 1: Update audit status to SENDING
    await step.run('update-status-sending', async () => {
      await prisma.emailAudit.update({
        where: { id: auditId },
        data: {
          status: 'SENDING',
          inngestRunId: event.id,
        },
      });
    });

    // Step 2: Process email based on entity type
    try {
      const result = await step.run('send-email', async () => {
        // Route to appropriate processor based on entity type
        if (email.entityType === 'invoice') {
          return await processInvoiceEmailHandler(email);
        } else if (email.entityType === 'quote') {
          return await processQuoteEmailHandler(email);
        } else if (email.entityType === 'report') {
          return await processReportEmailHandler(email);
        } else if (email.entityType === 'customer') {
          return await processCustomerEmailHandler(email);
        } else {
          throw new Error(`Unknown entity type: ${email.entityType}`);
        }
      });

      // Step 3: Update audit status to SENT
      await step.run('update-status-sent', async () => {
        await prisma.emailAudit.update({
          where: { id: auditId },
          data: {
            status: 'SENT',
            sentAt: new Date(),
            metadata: {
              ...(email.metadata || {}),
              emailId: result.emailId,
            },
          },
        });
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
      // Step 4: Update audit status to FAILED
      await step.run('update-status-failed', async () => {
        await prisma.emailAudit.update({
          where: { id: auditId },
          data: {
            status: 'FAILED',
            failedAt: new Date(),
            errorMessage: error instanceof Error ? error.message : 'Unknown error',
            retryCount: { increment: 1 },
          },
        });
      });

      logger.error('Email sending failed', error, {
        context: 'inngest-send-email',
        metadata: {
          auditId,
          emailType: email.emailType,
        },
      });

      throw error; // Re-throw to trigger Inngest retry
    }
  }
);

/**
 * Process invoice emails
 */
async function processInvoiceEmailHandler(email: any): Promise<{ emailId?: string }> {
  const type = email.emailType.replace('invoice.', '') as
    | 'pending'
    | 'reminder'
    | 'receipt'
    | 'overdue';

  // Map email types to processor types
  const typeMapping: Record<typeof type, 'pending_notification' | 'receipt' | 'reminder'> = {
    pending: 'pending_notification',
    receipt: 'receipt',
    reminder: 'reminder',
    overdue: 'reminder', // Use reminder template for overdue
  };

  const processorType = typeMapping[type];
  return await processInvoiceEmail(email.entityId, processorType);
}

/**
 * Process quote emails
 */
async function processQuoteEmailHandler(email: any): Promise<{ emailId?: string }> {
  const type = email.emailType.replace('quote.', '') as
    | 'sent'
    | 'reminder'
    | 'accepted'
    | 'rejected'
    | 'expired'
    | 'followup';

  // Map email types directly (no mapping needed, types match)
  const processorType = type as 'sent' | 'reminder' | 'accepted' | 'rejected' | 'expired' | 'followup';

  return await processQuoteEmail(email.entityId, processorType);
}

/**
 * Process report emails (to be implemented)
 */
async function processReportEmailHandler(email: any): Promise<{ emailId?: string }> {
  logger.warn('Report email processing not yet implemented', {
    context: 'inngest-send-email',
    metadata: { emailType: email.emailType },
  });

  // TODO: Implement report email processing
  return { emailId: undefined };
}

/**
 * Process customer notification emails (to be implemented)
 */
async function processCustomerEmailHandler(email: any): Promise<{ emailId?: string }> {
  logger.warn('Customer email processing not yet implemented', {
    context: 'inngest-send-email',
    metadata: { emailType: email.emailType },
  });

  // TODO: Implement customer notification email processing
  return { emailId: undefined };
}