import type { TaskDefinition } from '@/lib/tasks/types';
import { checkExpiredQuotesFunction } from '@/lib/inngest/functions/check-expired-quotes';

export const checkExpiredQuotesTask: TaskDefinition = {
  id: 'check-expired-quotes',
  name: 'Check Expired Quotes',
  description: 'Checks for expired quotes and updates their status',
  category: 'FINANCE',
  schedule: {
    cron: '0 0 * * *', // Daily at midnight
    timezone: 'UTC',
    enabled: true,
  },
  timeout: 300, // 5 minutes
  retries: 3,
  concurrencyLimit: 1,
  inngestFunction: checkExpiredQuotesFunction,
};
