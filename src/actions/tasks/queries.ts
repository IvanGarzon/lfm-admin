'use server';

import { auth } from '@/auth';
import { ScheduledTaskRepository } from '@/repositories/scheduled-task-repository';
import { TaskExecutionRepository } from '@/repositories/task-execution-repository';
import { prisma } from '@/lib/prisma';
import { handleActionError } from '@/lib/error-handler';
import type { ActionResult } from '@/types/actions';
import type { TaskPagination } from '@/features/tasks/types';
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
 * Retrieves all scheduled tasks with execution statistics.
 * Supports filtering by category, enabled status, and schedule type.
 * @param filters - Optional filters including category, isEnabled, and scheduleType.
 * @returns A promise that resolves to an `ActionResult` containing the paginated tasks.
 */
export async function getTasks(filters?: {
  category?: TaskCategory;
  isEnabled?: boolean;
  scheduleType?: ScheduleType;
}): Promise<ActionResult<TaskPagination>> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    const tasks = await taskRepo.findAllWithStats(filters);

    // Create pagination structure (simple pagination for now, all items on one page)
    const pagination = {
      totalItems: tasks.length,
      totalPages: 1,
      currentPage: 1,
      hasNextPage: false,
      hasPreviousPage: false,
      nextPage: null,
      previousPage: null,
    };

    return {
      success: true,
      data: {
        items: tasks,
        pagination,
      },
    };
  } catch (error) {
    return handleActionError(error, 'Failed to fetch tasks', {
      action: 'getTasks',
      userId: session.user.id,
    });
  }
}

/**
 * Retrieves a single scheduled task by ID with execution statistics.
 * Includes execution count and last execution details.
 * @param taskId - The unique identifier of the task to retrieve.
 * @returns A promise that resolves to an `ActionResult` containing the task with stats,
 * or an error if the task is not found.
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
 * Retrieves execution history for a specific task with statistics.
 * Supports pagination and filtering by status.
 * @param taskId - The unique identifier of the task.
 * @param options - Optional pagination and filtering options (limit, offset, status).
 * @returns A promise that resolves to an `ActionResult` containing executions and stats.
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
 * Retrieves a single task execution by ID.
 * Includes status, timing, result data, and error information.
 * @param executionId - The unique identifier of the execution to retrieve.
 * @returns A promise that resolves to an `ActionResult` containing the execution record,
 * or an error if the execution is not found.
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
 * Retrieves recent executions across all tasks.
 * Each execution includes basic task information for context.
 * @param limit - Maximum number of executions to return. Defaults to 10.
 * @returns A promise that resolves to an `ActionResult` containing the recent executions.
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
 * Retrieves task counts grouped by category.
 * Returns counts for SYSTEM, EMAIL, CLEANUP, FINANCE, and CUSTOM categories.
 * @returns A promise that resolves to an `ActionResult` containing category counts.
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
