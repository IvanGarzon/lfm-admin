/**
 * Inngest Function: Send Quote Expiry Reminders
 *
 * Automatically sends reminder emails for quotes expiring in 3 days.
 * Runs daily at 9 AM.
 */

import { inngest } from '@/lib/inngest/client';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { queueQuoteEmail } from '@/services/email-queue.service';

export const quoteExpiryReminderFunction = inngest.createFunction(
  {
    id: 'quote-expiry-reminder',
    name: 'Send Quote Expiry Reminders',
    retries: 3,
  },
  { cron: '0 9 * * *' }, // Daily at 9 AM
  async ({ step }) => {
    logger.info('Inngest function triggered - quote expiry reminder', {
      context: 'inngest-quote-expiry-reminder',
    });

    // Find quotes expiring in 3 days
    const expiringQuotes = await step.run('find-expiring-quotes', async () => {
      const threeDaysFromNow = new Date();
      threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
      threeDaysFromNow.setHours(23, 59, 59, 999); // End of day

      const startOfDay = new Date();
      startOfDay.setDate(startOfDay.getDate() + 3);
      startOfDay.setHours(0, 0, 0, 0); // Start of day

      return await prisma.quote.findMany({
        where: {
          status: 'SENT',
          validUntil: {
            gte: startOfDay,
            lte: threeDaysFromNow,
          },
          deletedAt: null,
        },
        include: {
          customer: true,
          items: true,
        },
      });
    });

    logger.info('Found expiring quotes', {
      context: 'inngest-quote-expiry-reminder',
      metadata: {
        count: expiringQuotes.length,
      },
    });

    // Queue reminder emails
    let queuedCount = 0;
    for (const quote of expiringQuotes) {
      await step.run(`queue-reminder-${quote.id}`, async () => {
        try {
          await queueQuoteEmail({
            quoteId: quote.id,
            customerId: quote.customer.id,
            type: 'reminder',
            recipient: quote.customer.email,
            subject: `Reminder: Quote ${quote.quoteNumber} expiring soon`,
            emailData: {
              quoteNumber: quote.quoteNumber,
              customerName: `${quote.customer.firstName} ${quote.customer.lastName}`,
              amount: Number(quote.amount),
              currency: quote.currency,
              issuedDate: quote.issuedDate,
              validUntil: quote.validUntil,
              itemCount: quote.items.length,
            },
          });
          queuedCount++;
        } catch (error) {
          logger.error('Failed to queue reminder email', error, {
            context: 'inngest-quote-expiry-reminder',
            metadata: {
              quoteId: quote.id,
              quoteNumber: quote.quoteNumber,
            },
          });
        }
      });
    }

    logger.info('Quote expiry reminders queued', {
      context: 'inngest-quote-expiry-reminder',
      metadata: {
        total: expiringQuotes.length,
        queued: queuedCount,
      },
    });

    return { success: true, total: expiringQuotes.length, queued: queuedCount };
  }
);
