/**
 * Inngest Function: Check and Mark Expired Quotes
 *
 * Automatically updates quote status from DRAFT/SENT to EXPIRED when validUntil date has passed.
 * Runs daily at midnight.
 * Does NOT send email notifications to customers.
 */

import { inngest } from '@/lib/inngest/client';
import { logger } from '@/lib/logger';
import { checkAndExpireQuotes } from '@/actions/quotes';

export const checkExpiredQuotesFunction = inngest.createFunction(
  {
    id: 'check-expired-quotes',
    name: 'Check and Mark Expired Quotes',
    retries: 3,
    timeouts: {
      finish: '2m', // Max 2 minutes for batch update
    },
  },
  [
    { cron: '0 0 * * *' }, // Daily at midnight
    { event: 'check-expired-quotes/manual' }, // Manual trigger
  ],
  async ({ step }) => {
    logger.info('Inngest function triggered - check expired quotes', {
      context: 'inngest-check-expired-quotes',
    });

    // Check and expire quotes that are past their validUntil date
    const result = await step.run('expire-quotes', async () => {
      const expireResult = await checkAndExpireQuotes();

      if (!expireResult.success) {
        throw new Error(expireResult.error || 'Failed to expire quotes');
      }

      return expireResult.data;
    });

    logger.info('Expired quotes check completed', {
      context: 'inngest-check-expired-quotes',
      metadata: {
        expiredCount: result?.count || 0,
      },
    });

    return { success: true, expiredCount: result?.count || 0 };
  },
);
