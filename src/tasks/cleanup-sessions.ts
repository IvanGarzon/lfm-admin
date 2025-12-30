import type { TaskDefinition } from '@/lib/tasks/types';
import { cleanupSessionsFunction } from '@/lib/inngest/functions/cleanup-sessions';

export const cleanupSessionsTask: TaskDefinition = {
  id: 'cleanup-sessions',
  name: 'Cleanup Sessions',
  description: 'Deactivates inactive sessions older than 30 days',
  category: 'CLEANUP',
  schedule: {
    cron: '0 0 * * *', // Daily at midnight
    timezone: 'UTC',
    enabled: true,
  },
  timeout: 300, // 5 minutes
  retries: 3,
  concurrencyLimit: 1,
  inngestFunction: cleanupSessionsFunction,
};
