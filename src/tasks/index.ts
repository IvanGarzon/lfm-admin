/**
 * Task Registry
 *
 * Central registry of all scheduled tasks in the application.
 * Each task is defined with its schedule, configuration, and Inngest function reference.
 */

import type { TaskRegistry } from '@/lib/tasks/types';
import { sendEmailTask } from './send-email';
import { cleanupSessionsTask } from './cleanup-sessions';
import { markOverdueInvoicesTask } from './mark-overdue-invoices';
import { checkExpiredQuotesTask } from './check-expired-quotes';
import { quoteExpiryReminderTask } from './quote-expiry-reminder';

/**
 * All registered tasks in the application
 *
 * To add a new task:
 * 1. Create a new file in this directory (e.g., my-task.ts)
 * 2. Define your task following the TaskDefinition interface
 * 3. Import and add it to this registry
 * 4. The task will be auto-synced to the database on next server start
 */
export const tasks: TaskRegistry = {
  'send-email': sendEmailTask,
  'cleanup-sessions': cleanupSessionsTask,
  'mark-overdue-invoices': markOverdueInvoicesTask,
  'check-expired-quotes': checkExpiredQuotesTask,
  'quote-expiry-reminder': quoteExpiryReminderTask,
};

/**
 * Helper to get all Inngest functions for registration
 */
export function getAllInngestFunctions() {
  return Object.values(tasks).map((task) => task.inngestFunction);
}

/**
 * Helper to get a task definition by ID
 */
export function getTaskById(id: string) {
  return tasks[id];
}

/**
 * Helper to get all task definitions as an array
 */
export function getAllTasks() {
  return Object.values(tasks);
}
