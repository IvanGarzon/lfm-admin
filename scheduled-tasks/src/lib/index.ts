import type { Span } from '@duke-hq/libtracing';

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
  cron: string;

  /**
   * Timezone for cron schedule evaluation.
   * Uses standard timezone identifiers (e.g., 'America/New_York', 'UTC').
   * If not specified, UTC is assumed.
   */
  timezone?: string;

  /**
   * Whether this task is enabled and should be considered for execution.
   * When false, the task will be skipped entirely.
   * @default true
   */
  enabled?: boolean;

  /**
   * If true, this task cannot be disabled via the enabled flag.
   * This is useful for critical system tasks that must always run.
   * @default false
   */
  alwaysEnabled?: boolean;
}

/**
 * Complete definition of a scheduled task including its execution logic,
 * scheduling configuration, timeout settings, and retry behavior.
 */
export interface TaskDefinition {
  /**
   * The actual task implementation function.
   * Receives a tracing span for logging and monitoring.
   * Should return a descriptive message about what was accomplished.
   *
   * @param span - Tracing span for logging task execution details
   * @returns Success message describing what the task accomplished
   * @throws Error if the task fails and should be retried or marked as failed
   */
  handler: (span: Span) => Promise<string> | string;

  /**
   * Schedule configuration defining when this task should run.
   */
  schedule: TaskSchedule;

  /**
   * Maximum time the task is allowed to run before being terminated, in minutes.
   * Tasks exceeding this timeout will be killed and marked as failed.
   * Choose based on expected task duration with some buffer for safety.
   */
  timeout: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

  /**
   * How to handle task failures:
   * - 'retry-on-fail': Failed tasks will be retried in the next scheduler run
   * - 'ignore': Failed tasks are logged but not retried, next run follows normal schedule
   */
  retryPolicy: 'retry-on-fail' | 'ignore';
}
