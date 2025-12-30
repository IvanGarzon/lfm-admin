import type { TaskDefinition } from '@/lib/tasks/types';
import { markOverdueInvoicesFunction } from '@/lib/inngest/functions/mark-overdue-invoices';

export const markOverdueInvoicesTask: TaskDefinition = {
  id: 'mark-overdue-invoices',
  name: 'Mark Overdue Invoices',
  description: 'Updates PENDING invoices to OVERDUE when past due date',
  category: 'FINANCE',
  schedule: {
    cron: '0 1 * * *', // Daily at 1:00 AM
    timezone: 'UTC',
    enabled: true,
  },
  timeout: 300, // 5 minutes
  retries: 3,
  concurrencyLimit: 1,
  inngestFunction: markOverdueInvoicesFunction,
};
