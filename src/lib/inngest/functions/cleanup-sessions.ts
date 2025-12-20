/**
 * Inngest Function: Cleanup Inactive Sessions
 *
 * Automatically deactivates sessions that have been inactive for more than 30 days.
 * Runs daily at midnight.
 */

import { inngest } from '@/lib/inngest/client';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { SessionRepository } from '@/repositories/session-repository';

const sessionRepo = new SessionRepository(prisma);
const INACTIVITY_THRESHOLD_DAYS = 30;

export const cleanupSessionsFunction = inngest.createFunction(
  {
    id: 'cleanup-sessions',
    name: 'Cleanup Inactive Sessions',
  },
  { cron: '0 0 * * *' },
  async ({ step }) => {
    logger.info('Inngest function triggered - cleanup inactive sessions', {
      context: 'inngest-cleanup-sessions',
    });

    const deactivatedCount = await step.run('deactivate-inactive-sessions', async () => {
      // Calculate threshold date (30 days ago)
      const threshold = new Date();
      threshold.setDate(threshold.getDate() - INACTIVITY_THRESHOLD_DAYS);

      // Deactivate sessions
      return await sessionRepo.deactivateInactive(threshold);
    });

    logger.info('Cleanup inactive sessions completed', {
      context: 'inngest-cleanup-sessions',
      metadata: {
        deactivatedCount,
        thresholdDays: INACTIVITY_THRESHOLD_DAYS,
      },
    });

    return { success: true, deactivatedCount };
  }
);
