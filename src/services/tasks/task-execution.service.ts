/**
 * Task Execution Service
 *
 * Handles manual task triggers and execution tracking.
 */

import { prisma } from '@/lib/prisma';
import { inngest } from '@/lib/inngest/client';
import { logger } from '@/lib/logger';
import { ScheduledTaskRepository } from '@/repositories/scheduled-task-repository';
import { TaskExecutionRepository } from '@/repositories/task-execution-repository';

const taskRepo = new ScheduledTaskRepository(prisma);
const executionRepo = new TaskExecutionRepository(prisma);

/**
 * Trigger a task manually
 *
 * @param taskId - The ID of the scheduled task
 * @param userId - The ID of the user triggering the task
 * @returns Promise with execution details
 */
export async function triggerTaskManually(
  taskId: string,
  userId?: string,
): Promise<{
  success: boolean;
  executionId: string;
  eventId: string;
}> {
  try {
    // Get the task
    const task = await taskRepo.findById(taskId);

    if (!task) {
      throw new Error('Task not found');
    }

    if (!task.isEnabled) {
      throw new Error('Task is disabled');
    }

    logger.info('Manually triggering task', {
      context: 'task-execution',
      metadata: {
        taskId,
        functionId: task.functionId,
        userId,
      },
    });

    // Create execution record
    const execution = await executionRepo.create({
      taskId,
      triggeredBy: 'MANUAL',
      triggeredByUser: userId,
    });

    // Generate event ID for the manual trigger
    const eventId = `task/${task.functionId}/manual/${execution.id}`;

    // Update execution with event ID
    await executionRepo.update(execution.id, {
      inngestEventId: eventId,
    });

    // Send event to Inngest to trigger the function
    // Use a special event pattern for manual triggers
    await inngest.send({
      id: eventId,
      name: `task/${task.functionId}/manual`,
      data: {
        taskId,
        executionId: execution.id,
        triggeredBy: userId,
        manual: true,
      },
    });

    logger.info('Task triggered successfully', {
      context: 'task-execution',
      metadata: {
        taskId,
        executionId: execution.id,
        eventId,
      },
    });

    return {
      success: true,
      executionId: execution.id,
      eventId,
    };
  } catch (error) {
    logger.error('Failed to trigger task manually', error, {
      context: 'task-execution',
      metadata: { taskId, userId },
    });

    throw error;
  }
}

/**
 * Track execution start
 *
 * @param params - Execution tracking parameters
 * @returns Promise with the execution record
 */
export async function trackExecutionStart(params: {
  taskId: string;
  inngestRunId: string;
  inngestEventId?: string;
  triggeredBy?: 'SCHEDULE' | 'MANUAL' | 'EVENT' | 'RETRY';
  triggeredByUser?: string;
}) {
  try {
    const execution = await executionRepo.create({
      taskId: params.taskId,
      inngestRunId: params.inngestRunId,
      inngestEventId: params.inngestEventId,
      triggeredBy: params.triggeredBy || 'SCHEDULE',
      triggeredByUser: params.triggeredByUser,
    });

    logger.info('Execution started', {
      context: 'task-execution',
      metadata: {
        executionId: execution.id,
        taskId: params.taskId,
        inngestRunId: params.inngestRunId,
      },
    });

    return execution;
  } catch (error) {
    logger.error('Failed to track execution start', error, {
      context: 'task-execution',
      metadata: params,
    });

    throw error;
  }
}

/**
 * Track execution completion
 *
 * @param inngestRunId - The Inngest run ID
 * @param result - The execution result
 * @returns Promise with the updated execution record
 */
export async function trackExecutionComplete(inngestRunId: string, result?: any) {
  try {
    const execution = await executionRepo.findByInngestRunId(inngestRunId);

    if (!execution) {
      logger.warn('Execution not found for completion tracking', {
        context: 'task-execution',
        metadata: { inngestRunId },
      });
      return null;
    }

    const updated = await executionRepo.markCompleted(execution.id, result);

    logger.info('Execution completed', {
      context: 'task-execution',
      metadata: {
        executionId: execution.id,
        inngestRunId,
        duration: updated.duration,
      },
    });

    return updated;
  } catch (error) {
    logger.error('Failed to track execution completion', error, {
      context: 'task-execution',
      metadata: { inngestRunId },
    });

    throw error;
  }
}

/**
 * Track execution failure
 *
 * @param inngestRunId - The Inngest run ID
 * @param error - The error message
 * @param stackTrace - The error stack trace
 * @returns Promise with the updated execution record
 */
export async function trackExecutionFailure(
  inngestRunId: string,
  error: string,
  stackTrace?: string,
) {
  try {
    const execution = await executionRepo.findByInngestRunId(inngestRunId);

    if (!execution) {
      logger.warn('Execution not found for failure tracking', {
        context: 'task-execution',
        metadata: { inngestRunId },
      });
      return null;
    }

    const updated = await executionRepo.markFailed(execution.id, error, stackTrace);

    logger.error('Execution failed', error, {
      context: 'task-execution',
      metadata: {
        executionId: execution.id,
        inngestRunId,
        duration: updated.duration,
      },
    });

    return updated;
  } catch (err) {
    logger.error('Failed to track execution failure', err, {
      context: 'task-execution',
      metadata: { inngestRunId },
    });

    throw err;
  }
}

/**
 * Get execution status by Inngest run ID
 *
 * @param inngestRunId - The Inngest run ID
 * @returns Promise with execution status or null
 */
export async function getExecutionStatus(inngestRunId: string) {
  try {
    const execution = await executionRepo.findByInngestRunId(inngestRunId);

    if (!execution) {
      return null;
    }

    return {
      id: execution.id,
      status: execution.status,
      startedAt: execution.startedAt,
      completedAt: execution.completedAt,
      duration: execution.duration,
      error: execution.error,
    };
  } catch (error) {
    logger.error('Failed to get execution status', error, {
      context: 'task-execution',
      metadata: { inngestRunId },
    });

    throw error;
  }
}
