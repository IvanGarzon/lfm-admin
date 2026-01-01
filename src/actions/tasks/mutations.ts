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
 * Updates the configuration of a scheduled task
 *
 * Allows administrators to modify task settings including scheduling, execution limits,
 * and custom metadata. This operation revalidates affected pages and requires ADMIN role.
 *
 * @param taskId - The unique identifier of the task to update
 * @param data - Partial task configuration to update
 * @param data.isEnabled - Whether the task is enabled for execution
 * @param data.cronSchedule - Cron expression for scheduled execution (e.g., "0 0 * * *")
 * @param data.retries - Maximum number of retry attempts on failure
 * @param data.concurrencyLimit - Maximum number of concurrent executions allowed
 * @param data.timeout - Execution timeout in milliseconds
 * @param data.metadata - Custom metadata object for the task
 *
 * @returns Promise resolving to ActionResult containing the updated task or error
 *
 * @throws Returns error if user is not authenticated or lacks ADMIN role
 *
 * @example
 * ```ts
 * const result = await updateTask('task-123', {
 *   isEnabled: true,
 *   cronSchedule: '0 0 * * *',
 *   retries: 3
 * });
 * ```
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
    revalidatePath('/tasks');
    revalidatePath(`/tasks/${taskId}`);

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
 * Enables or disables a scheduled task
 *
 * Controls whether a task can be executed. Disabled tasks will not run on their schedule
 * and cannot be manually triggered. This is useful for temporarily pausing tasks without
 * deleting them. Requires ADMIN role.
 *
 * @param taskId - The unique identifier of the task
 * @param isEnabled - True to enable the task, false to disable it
 *
 * @returns Promise resolving to ActionResult containing the updated task or error
 *
 * @throws Returns error if user is not authenticated or lacks ADMIN role
 *
 * @example
 * ```ts
 * // Disable a task
 * const result = await setTaskEnabled('task-123', false);
 *
 * // Enable a task
 * const result = await setTaskEnabled('task-123', true);
 * ```
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
    revalidatePath('/tasks');
    revalidatePath(`/tasks/${taskId}`);

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
 * Manually triggers a task execution via Inngest event
 *
 * Immediately executes a scheduled task outside of its normal schedule. Creates an execution
 * record, sends an Inngest event, and tracks the user who triggered it. The task must be
 * enabled to execute. Requires ADMIN or MANAGER role.
 *
 * @param taskId - The unique identifier of the task to execute
 *
 * @returns Promise resolving to ActionResult containing execution and task IDs or error
 *
 * @throws Returns error if:
 * - User is not authenticated or lacks ADMIN/MANAGER role
 * - Task is not found in the database
 * - Task is disabled
 * - Inngest event fails to send
 *
 * @example
 * ```ts
 * // Manually trigger a task
 * const result = await executeTask('task-123');
 * if (result.success) {
 *   console.log(`Execution started: ${result.data.executionId}`);
 * }
 * ```
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
    revalidatePath(`/tasks/${taskId}`);
    revalidatePath(`/tasks/${taskId}/executions`);

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
 * Synchronizes task definitions from code to the database
 *
 * Scans all task definitions registered in the codebase and syncs them with the database.
 * Creates new task records for any tasks that don't exist, and updates existing records
 * with the latest configuration from code. This ensures the database reflects the current
 * state of task definitions in the application. Requires ADMIN role.
 *
 * @returns Promise resolving to ActionResult containing sync statistics or error
 * @returns {number} data.synced - Total number of tasks synchronized
 * @returns {number} data.created - Number of new tasks created
 * @returns {number} data.updated - Number of existing tasks updated
 *
 * @throws Returns error if:
 * - User is not authenticated or lacks ADMIN role
 * - Task registry service fails to sync
 * - Database operation fails
 *
 * @example
 * ```ts
 * // Sync all tasks
 * const result = await syncTasks();
 * if (result.success) {
 *   console.log(`Synced ${result.data.synced} tasks`);
 *   console.log(`Created: ${result.data.created}, Updated: ${result.data.updated}`);
 * }
 * ```
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
    revalidatePath('/tasks');

    return { success: true, data: result };
  } catch (error) {
    return handleActionError(error, 'Failed to sync tasks', {
      action: 'syncTasks',
      userId: session.user.id,
    });
  }
}
