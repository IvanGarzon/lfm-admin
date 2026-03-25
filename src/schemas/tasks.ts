import { z } from 'zod';
import { TaskCategorySchema } from '@/zod/schemas/enums/TaskCategory.schema';
import { ScheduleTypeSchema } from '@/zod/schemas/enums/ScheduleType.schema';
import { ExecutionStatusSchema } from '@/zod/schemas/enums/ExecutionStatus.schema';

/**
 * Update Task Schema
 * Used for updating task configuration (cron schedule, retries, etc.)
 */
export const UpdateTaskSchema = z.object({
  id: z.cuid({ error: 'Invalid task ID' }),
  isEnabled: z.boolean().optional(),
  cronSchedule: z
    .string()
    .regex(
      /^(\*|([0-5]?\d)) (\*|([0-5]?\d)) (\*|(1?\d|2[0-3])) (\*|([1-9]|[12]\d|3[01])) (\*|([1-9]|1[0-2])) (\*|[0-6])$/,
      { message: 'Invalid cron expression' },
    )
    .optional(),
  retries: z
    .number()
    .int()
    .min(0, { error: 'Retries must be at least 0' })
    .max(10, { error: 'Retries cannot exceed 10' })
    .optional(),
  concurrencyLimit: z
    .number()
    .int()
    .min(1, { error: 'Concurrency limit must be at least 1' })
    .max(100, { error: 'Concurrency limit cannot exceed 100' })
    .optional(),
  timeout: z
    .number()
    .int()
    .min(1000, { error: 'Timeout must be at least 1000ms (1 second)' })
    .max(600000, { error: 'Timeout cannot exceed 600000ms (10 minutes)' })
    .optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

/**
 * Set Task Enabled Schema
 * Used for enabling/disabling tasks
 */
export const SetTaskEnabledSchema = z.object({
  id: z.cuid({ error: 'Invalid task ID' }),
  isEnabled: z.boolean({ error: 'isEnabled must be a boolean' }),
});

/**
 * Execute Task Schema
 * Used for manually triggering task execution
 */
export const ExecuteTaskSchema = z.object({
  id: z.cuid({ error: 'Invalid task ID' }),
});

/**
 * Get Tasks Schema
 * Used for filtering task lists
 */
export const GetTasksSchema = z.object({
  category: TaskCategorySchema.optional(),
  isEnabled: z.boolean().optional(),
  scheduleType: ScheduleTypeSchema.optional(),
});

/**
 * Get Task Executions Schema
 * Used for filtering task execution history
 */
export const GetTaskExecutionsSchema = z.object({
  taskId: z.cuid({ error: 'Invalid task ID' }),
  limit: z.number().int().min(1).max(100).optional(),
  offset: z.number().int().min(0).optional(),
  status: ExecutionStatusSchema.optional(),
});

/**
 * Get Recent Executions Schema
 * Used for fetching recent executions across all tasks
 */
export const GetRecentExecutionsSchema = z.object({
  limit: z.number().int().min(1).max(100).default(10),
});

// Export input types inferred from schemas
export type UpdateTaskInput = z.infer<typeof UpdateTaskSchema>;
export type SetTaskEnabledInput = z.infer<typeof SetTaskEnabledSchema>;
export type ExecuteTaskInput = z.infer<typeof ExecuteTaskSchema>;
export type GetTasksInput = z.infer<typeof GetTasksSchema>;
export type GetTaskExecutionsInput = z.infer<typeof GetTaskExecutionsSchema>;
export type GetRecentExecutionsInput = z.infer<typeof GetRecentExecutionsSchema>;
