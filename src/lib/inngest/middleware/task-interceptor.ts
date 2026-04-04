/**
 * Task Interceptor Middleware
 *
 * Inngest middleware that:
 * 1. Checks if a task is enabled before execution
 * 2. Tracks task executions in the database
 * 3. Updates execution status on completion or failure
 */

import { Middleware } from 'inngest';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { ScheduledTaskRepository } from '@/repositories/scheduled-task-repository';
import { TaskExecutionRepository } from '@/repositories/task-execution-repository';

const taskRepo = new ScheduledTaskRepository(prisma);
const executionRepo = new TaskExecutionRepository(prisma);

/**
 * Task interceptor middleware for Inngest.
 *
 * The SDK instantiates a fresh class per request, so instance variables are
 * safe to use for request-scoped state.
 */
export class TaskInterceptorMiddleware extends Middleware.BaseMiddleware {
  readonly id = 'task-interceptor';

  private executionId: string | undefined;

  // -- Lifecycle hooks -------------------------------------------------------

  async onRunStart({ fn, ctx }: Middleware.OnRunStartArgs) {
    const functionId = fn.id();
    const runId = ctx.runId;

    logger.info('Function execution starting', {
      context: 'task-interceptor',
      metadata: { functionId, runId },
    });

    const task = await taskRepo.findByFunctionId(functionId);

    if (!task) {
      logger.info('Function not registered as task, allowing execution', {
        context: 'task-interceptor',
        metadata: { functionId },
      });
      return;
    }

    if (!task.isEnabled) {
      logger.warn('Task is disabled, blocking execution', {
        context: 'task-interceptor',
        metadata: { functionId, taskId: task.id },
      });
      throw new Error(`Task '${functionId}' is currently disabled`);
    }

    try {
      const providedExecutionId = ctx.event.data?.executionId;

      if (typeof providedExecutionId === 'string') {
        this.executionId = providedExecutionId;

        await executionRepo.update(providedExecutionId, {
          status: 'RUNNING',
          inngestRunId: runId,
          inngestEventId: ctx.event.id,
        });

        logger.info('Using existing execution record, status set to RUNNING', {
          context: 'task-interceptor',
          metadata: { functionId, taskId: task.id, executionId: providedExecutionId },
        });
      } else {
        const existingExecution = await executionRepo.findByInngestRunId(runId);

        if (existingExecution) {
          this.executionId = existingExecution.id;

          logger.info('Found existing execution record (step replay)', {
            context: 'task-interceptor',
            metadata: { functionId, taskId: task.id, executionId: existingExecution.id, runId },
          });
        } else {
          const execution = await executionRepo.create({
            taskId: task.id,
            inngestRunId: runId,
            inngestEventId: ctx.event.id,
            triggeredBy: ctx.event.name.includes('/manual') ? 'MANUAL' : 'SCHEDULE',
            triggeredByUser: ctx.event.data?.triggeredBy,
          });

          this.executionId = execution.id;

          logger.info('Execution record created', {
            context: 'task-interceptor',
            metadata: { functionId, taskId: task.id, executionId: execution.id },
          });
        }
      }
    } catch (error) {
      logger.error('Failed to create/update execution record', error, {
        context: 'task-interceptor',
        metadata: { functionId, taskId: task.id },
      });
      // Continue execution even if tracking fails
    }
  }

  onRunComplete({ fn, ctx, output }: Middleware.OnRunCompleteArgs) {
    const functionId = fn.id();
    const runId = ctx.runId;

    logger.info('onRunComplete called', {
      context: 'task-interceptor',
      metadata: { functionId, runId, hasExecutionId: Boolean(this.executionId) },
    });

    if (this.executionId) {
      const executionId = this.executionId;

      executionRepo.markCompleted(executionId, output).catch((err) => {
        logger.error('Failed to mark execution as completed', err, {
          context: 'task-interceptor',
          metadata: { executionId },
        });
      });

      logger.info('Execution completed successfully', {
        context: 'task-interceptor',
        metadata: { functionId, executionId, runId },
      });
    } else {
      logger.warn('onRunComplete called but executionId is null', {
        context: 'task-interceptor',
        metadata: { functionId, runId },
      });
    }
  }

  onRunError({ fn, ctx, error }: Middleware.OnRunErrorArgs) {
    const functionId = fn.id();
    const runId = ctx.runId;

    logger.info('onRunError hook called', {
      context: 'task-interceptor',
      metadata: { functionId, runId, hasExecutionId: Boolean(this.executionId) },
    });

    if (this.executionId) {
      const executionId = this.executionId;
      const errorMessage = error instanceof Error ? error.message : String(error);
      const stackTrace = error instanceof Error ? error.stack : undefined;

      executionRepo.markFailed(executionId, errorMessage, stackTrace).catch((err) => {
        logger.error('Failed to mark execution as failed', err, {
          context: 'task-interceptor',
          metadata: { executionId },
        });
      });

      logger.error('Execution failed', error, {
        context: 'task-interceptor',
        metadata: { functionId, executionId, runId },
      });
    } else {
      logger.warn('onRunError called but executionId is null', {
        context: 'task-interceptor',
        metadata: { functionId, runId },
      });
    }
  }
}
