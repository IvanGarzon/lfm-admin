/**
 * Inngest Function: Mark Overdue Invoices
 *
 * Automatically updates PENDING invoices to OVERDUE when their due date has passed.
 * Runs daily at 1:00 AM.
 */

import { inngest } from '@/lib/inngest/client';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { InvoiceStatus } from '@/prisma/client';

export const markOverdueInvoicesFunction = inngest.createFunction(
  {
    id: 'mark-overdue-invoices',
    name: 'Mark Overdue Invoices',
  },
  [
    { cron: '0 1 * * *' }, // Daily at 1:00 AM
    { event: 'mark-overdue-invoices/manual' }, // Manual trigger
  ],
  async ({ step }) => {
    logger.info('Inngest function triggered - mark overdue invoices', {
      context: 'inngest-mark-overdue-invoices',
    });

    const updatedCount = await step.run('update-overdue-invoices', async () => {
      // Get start of today for comparison
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);

      // Update PENDING invoices that are past their due date
      const result = await prisma.invoice.updateMany({
        where: {
          status: InvoiceStatus.PENDING,
          dueDate: {
            lt: startOfToday,
          },
          deletedAt: null,
        },
        data: {
          status: InvoiceStatus.OVERDUE,
          updatedAt: new Date(),
        },
      });

      return result.count;
    });

    logger.info('Mark overdue invoices completed', {
      context: 'inngest-mark-overdue-invoices',
      metadata: {
        updatedCount,
      },
    });

    return { success: true, updatedCount };
  },
);
