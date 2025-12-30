/**
 * Task Definition Types
 *
 * Defines the structure for scheduled tasks in a clean, type-safe way.
 * Inspired by the Duke LMS approach but adapted for Inngest.
 */

import type { TaskCategory } from '@/prisma/client';

/**
 * Configuration for when and how a task should be scheduled to run.
 */
export interface TaskSchedule {
  /**
   * Cron expression defining when the task should run.
   * Examples:
   * - '0 0 * * *' (daily at midnight)
   * - '0 * * * *' (every hour)
   * - '0 0 * * 0' (weekly on Sunday)
   */
  cron?: string;

  /**
   * Event name for event-triggered tasks
   * Example: 'email/send'
   */
  event?: string;

  /**
   * Timezone for cron schedule evaluation.
   * Uses standard timezone identifiers (e.g., 'America/New_York', 'UTC').
   * @default 'UTC'
   */
  timezone?: string;

  /**
   * Whether this task is enabled and should be considered for execution.
   * When false, the task will be skipped entirely.
   * @default true
   */
  enabled?: boolean;
}

/**
 * Complete definition of a scheduled task including its execution logic,
 * scheduling configuration, timeout settings, and retry behavior.
 */
export interface TaskDefinition {
  /**
   * Unique identifier for the task
   */
  id: string;

  /**
   * Human-readable name for the task
   */
  name: string;

  /**
   * Description of what this task does
   */
  description?: string;

  /**
   * Task category for organization and filtering
   */
  category: TaskCategory;

  /**
   * Schedule configuration defining when this task should run.
   */
  schedule: TaskSchedule;

  /**
   * Maximum time the task is allowed to run before being terminated, in seconds.
   * Tasks exceeding this timeout will be killed and marked as failed.
   * @default 300 (5 minutes)
   */
  timeout?: number;

  /**
   * Number of times to retry the task on failure.
   * @default 3
   */
  retries?: number;

  /**
   * Maximum number of concurrent executions allowed.
   * @default 1
   */
  concurrencyLimit?: number;

  /**
   * Additional metadata for the task
   */
  metadata?: Record<string, any>;

  /**
   * Reference to the Inngest function that will execute this task
   */
  inngestFunction: any;
}

/**
 * Registry of all tasks in the application
 */
export type TaskRegistry = Record<string, TaskDefinition>;
