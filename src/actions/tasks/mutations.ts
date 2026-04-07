'use server';

import { ScheduledTaskRepository } from '@/repositories/scheduled-task-repository';
import { TaskExecutionRepository } from '@/repositories/task-execution-repository';
import { prisma } from '@/lib/prisma';
import { handleActionError } from '@/lib/error-handler';
import { logger } from '@/lib/logger';
import { revalidatePath } from 'next/cache';
import { getTaskById } from '@/tasks';
import { withAuth } from '@/lib/action-auth';
import type { ScheduledTask } from '@/prisma/client';
import type { ActionResult } from '@/types/actions';

const taskRepo = new ScheduledTaskRepository(prisma);
const executionRepo = new TaskExecutionRepository(prisma);

// -- Input Types -----------------------------------------------------------

type UpdateTaskInput = {
  taskId: string;
  data: {
    isEnabled?: boolean;
    cronSchedule?: string;
    retries?: number;
    concurrencyLimit?: number;
    timeout?: number;
    metadata?: Record<string, unknown>;
  };
};

type SetTaskEnabledInput = {
  taskId: string;
  isEnabled: boolean;
};

// -- Actions ---------------------------------------------------------------

export const updateTask = withAuth<UpdateTaskInput, ScheduledTask>(
  async (session, { taskId, data }) => {
    if (session.user.role !== 'ADMIN') {
      return { success: false, error: 'Forbidden: Only admins can modify tasks' };
    }

    try {
      const task = await taskRepo.update(taskId, data);

      revalidatePath('/tools/tasks');
      revalidatePath(`/tools/tasks/${taskId}`);

      return { success: true, data: task };
    } catch (error) {
      return handleActionError(error, 'Failed to update task', {
        action: 'updateTask',
        userId: session.user.id,
        taskId,
      });
    }
  },
);

export const setTaskEnabled = withAuth<SetTaskEnabledInput, ScheduledTask>(
  async (session, { taskId, isEnabled }) => {
    if (session.user.role !== 'ADMIN') {
      return { success: false, error: 'Forbidden: Only admins can modify tasks' };
    }

    try {
      const task = await taskRepo.setEnabled(taskId, isEnabled);

      revalidatePath('/tools/tasks');
      revalidatePath(`/tools/tasks/${taskId}`);

      return { success: true, data: task };
    } catch (error) {
      return handleActionError(error, `Failed to ${isEnabled ? 'enable' : 'disable'} task`, {
        action: 'setTaskEnabled',
        userId: session.user.id,
        taskId,
        isEnabled,
      });
    }
  },
);

export const executeTask = withAuth<string, { executionId: string; taskId: string }>(
  async (session, taskId) => {
    if (session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER') {
      return { success: false, error: 'Forbidden: Insufficient permissions to trigger tasks' };
    }

    try {
      const dbTask = await taskRepo.findById(taskId);
      if (!dbTask) {
        return { success: false, error: 'Task not found' };
      }

      if (!dbTask.isEnabled) {
        return { success: false, error: 'Task is disabled' };
      }

      logger.info('Triggering task via Inngest event', {
        context: 'task-execute',
        metadata: { taskId, functionId: dbTask.functionId, userId: session.user.id },
      });

      const execution = await executionRepo.create({
        taskId,
        triggeredBy: 'MANUAL',
        triggeredByUser: session.user.id,
      });

      const { inngest } = await import('@/lib/inngest/client');

      await inngest.send({
        name: `${dbTask.functionId}/manual`,
        data: {
          triggeredBy: session.user.id,
          executionId: execution.id,
        },
      });

      logger.info('Task triggered successfully', {
        context: 'task-execute',
        metadata: { executionId: execution.id, taskId, functionId: dbTask.functionId },
      });

      revalidatePath(`/tools/tasks/${taskId}`);
      revalidatePath(`/tools/tasks/${taskId}/executions`);

      return { success: true, data: { executionId: execution.id, taskId } };
    } catch (error) {
      return handleActionError(error, 'Failed to execute task', {
        action: 'executeTask',
        userId: session.user.id,
        taskId,
      });
    }
  },
);

export const syncTasks = withAuth<void, { synced: number; created: number; updated: number }>(
  async (session) => {
    if (session.user.role !== 'ADMIN') {
      return { success: false, error: 'Forbidden: Only admins can sync tasks' };
    }

    try {
      const { syncTasksToDatabase } = await import('@/services/tasks/task-registry.service');
      const { tasks } = await import('@/tasks');

      const result = await syncTasksToDatabase(tasks);

      logger.info('Tasks synced successfully', {
        context: 'task-sync',
        metadata: {
          userId: session.user.id,
          synced: result.synced,
          created: result.created,
          updated: result.updated,
        },
      });

      revalidatePath('/tools/tasks');

      return { success: true, data: result };
    } catch (error) {
      return handleActionError(error, 'Failed to sync tasks', {
        action: 'syncTasks',
        userId: session.user.id,
      });
    }
  },
);

export const executeTaskDirect = withAuth<string, { executionId: string; taskId: string }>(
  async (session, taskId) => {
    if (session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER') {
      return { success: false, error: 'Forbidden: Insufficient permissions to trigger tasks' };
    }

    try {
      const dbTask = await taskRepo.findById(taskId);
      if (!dbTask) {
        return { success: false, error: 'Task not found' };
      }

      if (!dbTask.isEnabled) {
        return { success: false, error: 'Task is disabled' };
      }

      const taskDef = getTaskById(dbTask.functionId);
      if (!taskDef) {
        return { success: false, error: 'Task definition not found' };
      }

      logger.info('Executing task directly', {
        context: 'task-execute-direct',
        metadata: { taskId, functionId: dbTask.functionId, userId: session.user.id },
      });

      const execution = await executionRepo.create({
        taskId,
        triggeredBy: 'MANUAL',
        triggeredByUser: session.user.id,
      });

      executeTaskInBackground(execution.id, taskDef, dbTask.functionId);

      revalidatePath(`/tools/tasks/${taskId}`);
      revalidatePath(`/tools/tasks/${taskId}/executions`);

      return { success: true, data: { executionId: execution.id, taskId } };
    } catch (error) {
      return handleActionError(error, 'Failed to execute task directly', {
        action: 'executeTaskDirect',
        userId: session.user.id,
        taskId,
      });
    }
  },
);

// -- Private Helpers -------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function executeTaskInBackground(executionId: string, taskDef: any, functionId: string) {
  const startTime = Date.now();

  try {
    const mockSpan = {
      log: (message: string, options?: Record<string, unknown>) => {
        logger.info(message, { context: `task:${functionId}`, metadata: options });
      },
      setAttributes: (attrs: Record<string, unknown>) => {
        logger.info('Task attributes', { context: `task:${functionId}`, metadata: attrs });
      },
      recordException: (error: Error) => {
        logger.error('Task exception', error, { context: `task:${functionId}` });
      },
    };

    const inngestFn = taskDef.inngestFunction;
    const timeoutMs = taskDef.timeout || 300000;
    const result = await Promise.race([
      executeInngestFunction(inngestFn, mockSpan),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Task timeout')), timeoutMs)),
    ]);

    const duration = Date.now() - startTime;

    await executionRepo.update(executionId, {
      status: 'COMPLETED',
      completedAt: new Date(),
      duration,
      result:
        typeof result === 'string' ? { message: result } : (result as Record<string, unknown>),
    });

    logger.info('Task executed successfully', {
      context: 'task-execute-direct',
      metadata: { executionId, duration, functionId },
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);
    const stackTrace = error instanceof Error ? error.stack : undefined;

    await executionRepo.update(executionId, {
      status: 'FAILED',
      completedAt: new Date(),
      duration,
      error: errorMessage,
      stackTrace,
    });

    logger.error('Task execution failed', error, {
      context: 'task-execute-direct',
      metadata: { executionId, duration, functionId },
    });
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function executeInngestFunction(
  inngestFn: any,
  mockSpan: unknown,
): Promise<ActionResult<unknown>> {
  const fnConfig = inngestFn._def || inngestFn.config || {};
  const handler = fnConfig.fn || fnConfig.handler;

  if (!handler) {
    throw new Error('Could not find function handler');
  }

  const mockContext = {
    event: {
      id: `direct-${Date.now()}`,
      name: 'manual-trigger',
      data: {},
      ts: Date.now(),
    },
    step: {
      run: async (name: string, fn: () => unknown) => {
        if (
          mockSpan !== null &&
          typeof mockSpan === 'object' &&
          'log' in mockSpan &&
          typeof mockSpan.log === 'function'
        ) {
          mockSpan.log(`Step: ${name}`);
        }
        return await fn();
      },
      sleep: async (duration: number) => {
        return new Promise((resolve) => setTimeout(resolve, duration));
      },
    },
  };

  return await handler(mockContext, mockSpan);
}
