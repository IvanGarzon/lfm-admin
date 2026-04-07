'use server';

import { ScheduledTaskRepository } from '@/repositories/scheduled-task-repository';
import { TaskExecutionRepository } from '@/repositories/task-execution-repository';
import { prisma } from '@/lib/prisma';
import { handleActionError } from '@/lib/error-handler';
import { withAuth } from '@/lib/action-auth';
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

// -- Input Types -----------------------------------------------------------

type GetTasksInput =
  | {
      category?: TaskCategory;
      isEnabled?: boolean;
      scheduleType?: ScheduleType;
    }
  | undefined;

type GetTaskExecutionsInput = {
  taskId: string;
  options?: {
    limit?: number;
    offset?: number;
    status?: ExecutionStatus;
  };
};

// -- Actions ---------------------------------------------------------------

export const getTasks = withAuth<GetTasksInput, TaskPagination>(async (_session, filters) => {
  try {
    const tasks = await taskRepo.findAllWithStats(filters);

    const pagination = {
      totalItems: tasks.length,
      totalPages: 1,
      currentPage: 1,
      hasNextPage: false,
      hasPreviousPage: false,
      nextPage: null,
      previousPage: null,
    };

    return { success: true, data: { items: tasks, pagination } };
  } catch (error) {
    return handleActionError(error, 'Failed to fetch tasks', { action: 'getTasks' });
  }
});

export const getTaskById = withAuth<
  string,
  ScheduledTask & {
    _count: { executions: number };
    lastExecution?: {
      id: string;
      status: string;
      startedAt: Date;
      completedAt: Date | null;
    } | null;
  }
>(async (_session, taskId) => {
  try {
    const task = await taskRepo.findByIdWithStats(taskId);

    if (!task) {
      return { success: false, error: 'Task not found' };
    }

    return { success: true, data: task };
  } catch (error) {
    return handleActionError(error, 'Failed to fetch task', { action: 'getTaskById', taskId });
  }
});

export const getTaskExecutions = withAuth<
  GetTaskExecutionsInput,
  {
    executions: TaskExecution[];
    stats: {
      total: number;
      completed: number;
      failed: number;
      running: number;
      avgDuration: number | null;
    };
  }
>(async (_session, { taskId, options }) => {
  try {
    const executions = await executionRepo.findByTaskId(taskId, options);
    const stats = await executionRepo.getStats(taskId);

    return { success: true, data: { executions, stats } };
  } catch (error) {
    return handleActionError(error, 'Failed to fetch task executions', {
      action: 'getTaskExecutions',
      taskId,
    });
  }
});

export const getExecutionById = withAuth<string, TaskExecution>(async (_session, executionId) => {
  try {
    const execution = await executionRepo.findById(executionId);

    if (!execution) {
      return { success: false, error: 'Execution not found' };
    }

    return { success: true, data: execution };
  } catch (error) {
    return handleActionError(error, 'Failed to fetch execution', {
      action: 'getExecutionById',
      executionId,
    });
  }
});

export const getRecentExecutions = withAuth<
  number | undefined,
  (TaskExecution & { task: { id: string; functionName: string; category: string } })[]
>(async (_session, limit) => {
  try {
    const executions = await executionRepo.findRecent(limit ?? 10);
    return { success: true, data: executions };
  } catch (error) {
    return handleActionError(error, 'Failed to fetch recent executions', {
      action: 'getRecentExecutions',
    });
  }
});

export const getTaskCountsByCategory = withAuth<void, Record<TaskCategory, number>>(
  async (_session) => {
    try {
      const counts = await taskRepo.countByCategory();
      return { success: true, data: counts };
    } catch (error) {
      return handleActionError(error, 'Failed to fetch task counts', {
        action: 'getTaskCountsByCategory',
      });
    }
  },
);
