import type { TaskDefinition } from '@/lib/tasks/types';
import { quoteExpiryReminderFunction } from '@/lib/inngest/functions/quote-expiry-reminder';

export const quoteExpiryReminderTask: TaskDefinition = {
  id: 'quote-expiry-reminder',
  name: 'Quote Expiry Reminder',
  description: 'Sends reminder emails for quotes expiring soon',
  category: 'FINANCE',
  schedule: {
    cron: '0 9 * * *', // Daily at 9:00 AM
    timezone: 'UTC',
    enabled: true,
  },
  timeout: 300, // 5 minutes
  retries: 3,
  concurrencyLimit: 1,
  inngestFunction: quoteExpiryReminderFunction,
};
