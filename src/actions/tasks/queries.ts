'use server';

import { auth } from '@/auth';
import { ScheduledTaskRepository } from '@/repositories/scheduled-task-repository';
import { TaskExecutionRepository } from '@/repositories/task-execution-repository';
import { prisma } from '@/lib/prisma';
import { handleActionError } from '@/lib/error-handler';
import type { ActionResult } from '@/types/actions';
import type {
  ScheduledTask,
  TaskExecution,
  TaskCategory,
  ScheduleType,
  ExecutionStatus,
} from '@/prisma/client';

const taskRepo = new ScheduledTaskRepository(prisma);
const executionRepo = new TaskExecutionRepository(prisma);

/**
 * Retrieves all scheduled tasks with execution statistics and optional filtering
 *
 * Fetches a comprehensive list of scheduled tasks including execution counts and information
 * about the last execution (status, timing, triggering user). Results can be filtered by
 * category, enabled status, and schedule type. Requires authentication.
 *
 * @param filters - Optional filters to narrow down results
 * @param filters.category - Filter by task category (SYSTEM, EMAIL, CLEANUP, FINANCE, CUSTOM)
 * @param filters.isEnabled - Filter by enabled/disabled status
 * @param filters.scheduleType - Filter by schedule type (CRON or EVENT)
 *
 * @returns Promise resolving to ActionResult containing array of tasks with stats or error
 * @returns Tasks include:
 * - All task properties from ScheduledTask model
 * - _count.executions: Total number of executions
 * - lastExecution: Details of the most recent execution (if any)
 *
 * @throws Returns error if user is not authenticated
 *
 * @example
 * ```ts
 * // Get all tasks
 * const allTasks = await getTasks();
 *
 * // Get only enabled email tasks
 * const emailTasks = await getTasks({
 *   category: 'EMAIL',
 *   isEnabled: true
 * });
 * ```
 */
export async function getTasks(filters?: {
  category?: TaskCategory;
  isEnabled?: boolean;
  scheduleType?: ScheduleType;
}): Promise<
  ActionResult<
    (ScheduledTask & {
      _count: { executions: number };
      lastExecution?: {
        id: string;
        status: string;
        startedAt: Date;
        completedAt: Date | null;
        triggeredByUser: string | null;
        user?: {
          firstName: string;
          lastName: string;
          email: string | null;
        } | null;
      } | null;
    })[]
  >
> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    const tasks = await taskRepo.findAllWithStats(filters);
    return { success: true, data: tasks };
  } catch (error) {
    return handleActionError(error, 'Failed to fetch tasks', {
      action: 'getTasks',
      userId: session.user.id,
    });
  }
}

/**
 * Retrieves a single scheduled task by ID with execution statistics
 *
 * Fetches detailed information about a specific task including total execution count
 * and details about the most recent execution. Useful for task detail pages and
 * monitoring individual task performance. Requires authentication.
 *
 * @param taskId - The unique identifier of the task to retrieve
 *
 * @returns Promise resolving to ActionResult containing task with stats or error
 * @returns Task includes:
 * - All task properties from ScheduledTask model
 * - _count.executions: Total number of executions
 * - lastExecution: Details of the most recent execution (if any)
 *
 * @throws Returns error if:
 * - User is not authenticated
 * - Task is not found in the database
 *
 * @example
 * ```ts
 * const result = await getTaskById('task-123');
 * if (result.success) {
 *   console.log(`Task: ${result.data.functionName}`);
 *   console.log(`Executions: ${result.data._count.executions}`);
 *   console.log(`Last run: ${result.data.lastExecution?.startedAt}`);
 * }
 * ```
 */
export async function getTaskById(taskId: string): Promise<
  ActionResult<
    ScheduledTask & {
      _count: { executions: number };
      lastExecution?: {
        id: string;
        status: string;
        startedAt: Date;
        completedAt: Date | null;
      } | null;
    }
  >
> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    const task = await taskRepo.findByIdWithStats(taskId);

    if (!task) {
      return { success: false, error: 'Task not found' };
    }

    return { success: true, data: task };
  } catch (error) {
    return handleActionError(error, 'Failed to fetch task', {
      action: 'getTaskById',
      userId: session.user.id,
      taskId,
    });
  }
}

/**
 * Retrieves execution history for a specific task with statistics
 *
 * Fetches paginated execution records for a task along with aggregated statistics.
 * Useful for monitoring task performance, debugging failures, and analyzing execution
 * patterns. Supports filtering by status and pagination. Requires authentication.
 *
 * @param taskId - The unique identifier of the task
 * @param options - Optional pagination and filtering options
 * @param options.limit - Maximum number of executions to return (for pagination)
 * @param options.offset - Number of executions to skip (for pagination)
 * @param options.status - Filter executions by status (RUNNING, COMPLETED, FAILED, CANCELLED, TIMEOUT)
 *
 * @returns Promise resolving to ActionResult containing executions and stats or error
 * @returns {TaskExecution[]} data.executions - Array of execution records
 * @returns {object} data.stats - Aggregated statistics
 * @returns {number} data.stats.total - Total number of executions
 * @returns {number} data.stats.completed - Number of successful executions
 * @returns {number} data.stats.failed - Number of failed executions
 * @returns {number} data.stats.running - Number of currently running executions
 * @returns {number|null} data.stats.avgDuration - Average execution duration in milliseconds
 *
 * @throws Returns error if user is not authenticated
 *
 * @example
 * ```ts
 * // Get recent executions with stats
 * const result = await getTaskExecutions('task-123', { limit: 20, offset: 0 });
 *
 * // Get only failed executions
 * const failures = await getTaskExecutions('task-123', { status: 'FAILED' });
 * ```
 */
export async function getTaskExecutions(
  taskId: string,
  options?: {
    limit?: number;
    offset?: number;
    status?: ExecutionStatus;
  },
): Promise<
  ActionResult<{
    executions: TaskExecution[];
    stats: {
      total: number;
      completed: number;
      failed: number;
      running: number;
      avgDuration: number | null;
    };
  }>
> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    const executions = await executionRepo.findByTaskId(taskId, options);
    const stats = await executionRepo.getStats(taskId);

    return {
      success: true,
      data: {
        executions,
        stats,
      },
    };
  } catch (error) {
    return handleActionError(error, 'Failed to fetch task executions', {
      action: 'getTaskExecutions',
      userId: session.user.id,
      taskId,
    });
  }
}

/**
 * Retrieves a single task execution by ID
 *
 * Fetches detailed information about a specific task execution including its status,
 * timing, result data, and error information. Useful for debugging failed executions
 * and viewing execution details. Requires authentication.
 *
 * @param executionId - The unique identifier of the execution to retrieve
 *
 * @returns Promise resolving to ActionResult containing the execution record or error
 * @returns Execution includes all TaskExecution model properties:
 * - id, taskId, status, triggeredBy
 * - startedAt, completedAt, duration
 * - resultData, errorMessage, errorStack
 * - createdAt, updatedAt
 *
 * @throws Returns error if:
 * - User is not authenticated
 * - Execution is not found in the database
 *
 * @example
 * ```ts
 * const result = await getExecutionById('exec-123');
 * if (result.success) {
 *   console.log(`Status: ${result.data.status}`);
 *   console.log(`Duration: ${result.data.duration}ms`);
 *   if (result.data.errorMessage) {
 *     console.error(`Error: ${result.data.errorMessage}`);
 *   }
 * }
 * ```
 */
export async function getExecutionById(executionId: string): Promise<ActionResult<TaskExecution>> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    const execution = await executionRepo.findById(executionId);

    if (!execution) {
      return { success: false, error: 'Execution not found' };
    }

    return { success: true, data: execution };
  } catch (error) {
    return handleActionError(error, 'Failed to fetch execution', {
      action: 'getExecutionById',
      userId: session.user.id,
      executionId,
    });
  }
}

/**
 * Retrieves recent executions across all tasks
 *
 * Fetches the most recent task executions from all tasks in the system, ordered by
 * start time. Each execution includes basic task information for context. Useful for
 * dashboard activity feeds and system-wide execution monitoring. Requires authentication.
 *
 * @param limit - Maximum number of executions to return (default: 10)
 *
 * @returns Promise resolving to ActionResult containing array of executions or error
 * @returns Each execution includes:
 * - All TaskExecution model properties
 * - task.id: The task's unique identifier
 * - task.functionName: The task's function name
 * - task.category: The task's category
 *
 * @throws Returns error if user is not authenticated
 *
 * @example
 * ```ts
 * // Get last 10 executions
 * const result = await getRecentExecutions();
 *
 * // Get last 50 executions for detailed monitoring
 * const result = await getRecentExecutions(50);
 * if (result.success) {
 *   result.data.forEach(exec => {
 *     console.log(`${exec.task.functionName}: ${exec.status}`);
 *   });
 * }
 * ```
 */
export async function getRecentExecutions(limit: number = 10): Promise<
  ActionResult<
    (TaskExecution & {
      task: {
        id: string;
        functionName: string;
        category: string;
      };
    })[]
  >
> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    const executions = await executionRepo.findRecent(limit);
    return { success: true, data: executions };
  } catch (error) {
    return handleActionError(error, 'Failed to fetch recent executions', {
      action: 'getRecentExecutions',
      userId: session.user.id,
    });
  }
}

/**
 * Retrieves task counts grouped by category
 *
 * Provides aggregated counts of tasks for each category (SYSTEM, EMAIL, CLEANUP, FINANCE, CUSTOM).
 * Useful for dashboard statistics, analytics, and understanding task distribution across
 * different functional areas. Requires authentication.
 *
 * @returns Promise resolving to ActionResult containing category counts or error
 * @returns Object with category names as keys and counts as values:
 * - SYSTEM: number - Count of system tasks
 * - EMAIL: number - Count of email tasks
 * - CLEANUP: number - Count of cleanup tasks
 * - FINANCE: number - Count of finance tasks
 * - CUSTOM: number - Count of custom tasks
 *
 * @throws Returns error if user is not authenticated
 *
 * @example
 * ```ts
 * const result = await getTaskCountsByCategory();
 * if (result.success) {
 *   console.log(`Email tasks: ${result.data.EMAIL}`);
 *   console.log(`Finance tasks: ${result.data.FINANCE}`);
 *
 *   // Calculate total tasks
 *   const total = Object.values(result.data).reduce((sum, count) => sum + count, 0);
 *   console.log(`Total tasks: ${total}`);
 * }
 * ```
 */
export async function getTaskCountsByCategory(): Promise<
  ActionResult<Record<TaskCategory, number>>
> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    const counts = await taskRepo.countByCategory();
    return { success: true, data: counts };
  } catch (error) {
    return handleActionError(error, 'Failed to fetch task counts', {
      action: 'getTaskCountsByCategory',
      userId: session.user.id,
    });
  }
}
