import cron from 'node-cron';
import { logger } from '@/lib/logger';
import { env } from '@/env';

export async function initCronJobs() {
  // Run every day at midnight
  // 0 0 * * *
  cron.schedule('0 0 * * *', async () => {
    logger.info('Starting daily overdue invoice check...', { context: 'CronJob' });
    try {
      // Call our own API route to keep logic centralized and utilize the same path as external triggers
      const response = await fetch(`${env.NEXT_PUBLIC_APP_URL}/api/cron/invoices/update-status`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${env.CRON_SECRET}`,
        },
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update invoices');
      }

      logger.info('Daily overdue check completed', { 
        context: 'CronJob',
        metadata: { result: data }
      });
    } catch (error) {
      logger.error('Daily overdue check failed', error, { context: 'CronJob' });
    }
  });

  logger.info('Cron jobs initialized', { context: 'System' });
}
