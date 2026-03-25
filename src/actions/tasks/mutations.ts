'use server';

import { auth } from '@/auth';
import { ScheduledTaskRepository } from '@/repositories/scheduled-task-repository';
import { TaskExecutionRepository } from '@/repositories/task-execution-repository';
import { prisma } from '@/lib/prisma';
import { handleActionError } from '@/lib/error-handler';
import { logger } from '@/lib/logger';
import type { ActionResult } from '@/types/actions';
import type { ScheduledTask } from '@/prisma/client';
import { revalidatePath } from 'next/cache';
import { getTaskById } from '@/tasks';

const taskRepo = new ScheduledTaskRepository(prisma);
const executionRepo = new TaskExecutionRepository(prisma);

/**
 * Updates the configuration of a scheduled task.
 * Allows modifying scheduling, execution limits, and custom metadata.
 * @param taskId - The unique identifier of the task to update.
 * @param data - Partial task configuration to update.
 * @returns A promise that resolves to an `ActionResult` containing the updated task.
 */
export async function updateTask(
  taskId: string,
  data: {
    isEnabled?: boolean;
    cronSchedule?: string;
    retries?: number;
    concurrencyLimit?: number;
    timeout?: number;
    metadata?: any;
  },
): Promise<ActionResult<ScheduledTask>> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: 'Unauthorized' };
  }

  // Check if user has permission (only ADMIN can modify tasks)
  if (session.user.role !== 'ADMIN') {
    return { success: false, error: 'Forbidden: Only admins can modify tasks' };
  }

  try {
    const task = await taskRepo.update(taskId, data);

    // Revalidate pages that might display this task
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
}

/**
 * Enables or disables a scheduled task.
 * Disabled tasks will not run on their schedule and cannot be manually triggered.
 * @param taskId - The unique identifier of the task.
 * @param isEnabled - True to enable the task, false to disable it.
 * @returns A promise that resolves to an `ActionResult` containing the updated task.
 */
export async function setTaskEnabled(
  taskId: string,
  isEnabled: boolean,
): Promise<ActionResult<ScheduledTask>> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: 'Unauthorized' };
  }

  // Check if user has permission (only ADMIN can modify tasks)
  if (session.user.role !== 'ADMIN') {
    return { success: false, error: 'Forbidden: Only admins can modify tasks' };
  }

  try {
    const task = await taskRepo.setEnabled(taskId, isEnabled);

    // Revalidate pages
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
}

/**
 * Manually triggers a task execution via Inngest event.
 * Creates an execution record and tracks the user who triggered it.
 * @param taskId - The unique identifier of the task to execute.
 * @returns A promise that resolves to an `ActionResult` with the execution and task IDs,
 * or an error if the task is not found or disabled.
 */
export async function executeTask(taskId: string): Promise<
  ActionResult<{
    executionId: string;
    taskId: string;
  }>
> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: 'Unauthorized' };
  }

  // Check if user has permission (ADMIN or MANAGER can trigger tasks)
  if (session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER') {
    return { success: false, error: 'Forbidden: Insufficient permissions to trigger tasks' };
  }

  try {
    // Get task from database
    const dbTask = await taskRepo.findById(taskId);
    if (!dbTask) {
      return { success: false, error: 'Task not found' };
    }

    if (!dbTask.isEnabled) {
      return { success: false, error: 'Task is disabled' };
    }

    logger.info('Triggering task via Inngest event', {
      context: 'task-execute',
      metadata: {
        taskId,
        functionId: dbTask.functionId,
        userId: session.user.id,
      },
    });

    // Create execution record
    const execution = await executionRepo.create({
      taskId,
      triggeredBy: 'MANUAL',
      triggeredByUser: session.user.id,
    });

    // Trigger the task via Inngest event
    // Use dynamic import to avoid circular dependency
    const { inngest } = await import('@/lib/inngest/client');

    await inngest.send({
      name: `${dbTask.functionId}/manual`,
      data: {
        triggeredBy: session.user.id,
        executionId: execution.id, // Pass execution ID to middleware
      },
    });

    logger.info('Task triggered successfully', {
      context: 'task-execute',
      metadata: { executionId: execution.id, taskId, functionId: dbTask.functionId },
    });

    // Revalidate execution pages
    revalidatePath(`/tools/tasks/${taskId}`);
    revalidatePath(`/tools/tasks/${taskId}/executions`);

    return {
      success: true,
      data: {
        executionId: execution.id,
        taskId,
      },
    };
  } catch (error) {
    return handleActionError(error, 'Failed to execute task', {
      action: 'executeTask',
      userId: session.user.id,
      taskId,
    });
  }
}

/**
 * Synchronizes task definitions from code to the database.
 * Creates new task records and updates existing ones with the latest configuration.
 * @returns A promise that resolves to an `ActionResult` with sync statistics (synced, created, updated).
 */
export async function syncTasks(): Promise<
  ActionResult<{
    synced: number;
    created: number;
    updated: number;
  }>
> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: 'Unauthorized' };
  }

  // Check if user has permission (only ADMIN can sync tasks)
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

    // Revalidate tasks page
    revalidatePath('/tools/tasks');

    return { success: true, data: result };
  } catch (error) {
    return handleActionError(error, 'Failed to sync tasks', {
      action: 'syncTasks',
      userId: session.user.id,
    });
  }
}

/**
 * Executes a task directly without using Inngest events.
 * Bypasses Inngest's event system by calling task handlers directly.
 * Useful for manual triggers without INNGEST_EVENT_KEY configuration.
 * @param taskId - The unique identifier of the task to execute.
 * @returns A promise that resolves to an `ActionResult` with execution and task IDs,
 * or an error if the task is not found or disabled.
 */
export async function executeTaskDirect(taskId: string): Promise<
  ActionResult<{
    executionId: string;
    taskId: string;
  }>
> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: 'Unauthorized' };
  }

  // Check if user has permission (ADMIN or MANAGER can trigger tasks)
  if (session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER') {
    return { success: false, error: 'Forbidden: Insufficient permissions to trigger tasks' };
  }

  try {
    // Get task from database
    const dbTask = await taskRepo.findById(taskId);
    if (!dbTask) {
      return { success: false, error: 'Task not found' };
    }

    if (!dbTask.isEnabled) {
      return { success: false, error: 'Task is disabled' };
    }

    // Get task definition
    const taskDef = getTaskById(dbTask.functionId);
    if (!taskDef) {
      return { success: false, error: 'Task definition not found' };
    }

    logger.info('Executing task directly', {
      context: 'task-execute-direct',
      metadata: {
        taskId,
        functionId: dbTask.functionId,
        userId: session.user.id,
      },
    });

    // Create execution record
    const execution = await executionRepo.create({
      taskId,
      triggeredBy: 'MANUAL',
      triggeredByUser: session.user.id,
    });

    // Execute task in background
    executeTaskInBackground(execution.id, taskDef, dbTask.functionId);

    // Revalidate execution pages
    revalidatePath(`/tools/tasks/${taskId}`);
    revalidatePath(`/tools/tasks/${taskId}/executions`);

    return {
      success: true,
      data: {
        executionId: execution.id,
        taskId,
      },
    };
  } catch (error) {
    return handleActionError(error, 'Failed to execute task directly', {
      action: 'executeTaskDirect',
      userId: session.user.id,
      taskId,
    });
  }
}

/**
 * Execute task in background and update execution status
 */
async function executeTaskInBackground(executionId: string, taskDef: any, functionId: string) {
  const startTime = Date.now();

  try {
    // Create a mock span for compatibility
    const mockSpan = {
      log: (message: string, options?: any) => {
        logger.info(message, {
          context: `task:${functionId}`,
          metadata: options,
        });
      },
      setAttributes: (attrs: Record<string, any>) => {
        logger.info('Task attributes', {
          context: `task:${functionId}`,
          metadata: attrs,
        });
      },
      recordException: (error: Error) => {
        logger.error('Task exception', error, {
          context: `task:${functionId}`,
        });
      },
    };

    // Find and execute the Inngest function handler
    const inngestFn = taskDef.inngestFunction;

    // Execute with timeout
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
      result: typeof result === 'string' ? { message: result } : result,
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

/**
 * Execute an Inngest function's handler directly
 */
async function executeInngestFunction(inngestFn: any, mockSpan: any) {
  const fnConfig = (inngestFn as any)._def || (inngestFn as any).config || {};
  const handler = fnConfig.fn || fnConfig.handler;

  if (!handler) {
    throw new Error('Could not find function handler');
  }

  // Call the handler with mock context
  const mockContext = {
    event: {
      id: `direct-${Date.now()}`,
      name: 'manual-trigger',
      data: {},
      ts: Date.now(),
    },
    step: {
      run: async (name: string, fn: () => any) => {
        mockSpan.log(`Step: ${name}`);
        return await fn();
      },
      sleep: async (duration: number) => {
        return new Promise((resolve) => setTimeout(resolve, duration));
      },
    },
  };

  return await handler(mockContext, mockSpan);
}
