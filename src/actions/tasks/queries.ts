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
 * Get all scheduled tasks with optional filters and execution stats
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
 * Get task by ID with statistics
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
 * Get execution history for a task
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
 * Get execution by ID
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
 * Get recent executions across all tasks
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
 * Get counts by category
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
