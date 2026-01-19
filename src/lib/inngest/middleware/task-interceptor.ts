/**
 * Task Interceptor Middleware
 *
 * Inngest middleware that:
 * 1. Checks if a task is enabled before execution
 * 2. Tracks task executions in the database
 * 3. Updates execution status on completion or failure
 */

import { InngestMiddleware } from 'inngest';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { ScheduledTaskRepository } from '@/repositories/scheduled-task-repository';
import { TaskExecutionRepository } from '@/repositories/task-execution-repository';

const taskRepo = new ScheduledTaskRepository(prisma);
const executionRepo = new TaskExecutionRepository(prisma);

/**
 * Task interceptor middleware for Inngest
 */
export const taskInterceptor = () =>
  new InngestMiddleware({
    name: 'Task Interceptor',
    init() {
      return {
        async onFunctionRun({ fn, ctx }) {
          const functionId = fn.id();
          const runId = ctx.runId;

          logger.info('Function execution starting', {
            context: 'task-interceptor',
            metadata: { functionId, runId },
          });

          // Check if this function is registered as a scheduled task
          const task = await taskRepo.findByFunctionId(functionId);

          if (!task) {
            // Function is not registered - allow execution without tracking
            logger.info('Function not registered as task, allowing execution', {
              context: 'task-interceptor',
              metadata: { functionId },
            });
            return {};
          }

          // Check if task is enabled
          if (!task.isEnabled) {
            logger.warn('Task is disabled, blocking execution', {
              context: 'task-interceptor',
              metadata: { functionId, taskId: task.id },
            });

            // Throw error to prevent execution
            throw new Error(`Task '${functionId}' is currently disabled`);
          }

          // Get or create execution record
          let executionId: string | null = null;

          try {
            // Check if execution ID was provided in event data (for manual triggers)
            const providedExecutionId = ctx.event.data?.executionId;
            if (typeof providedExecutionId === 'string') {
              executionId = providedExecutionId;

              // Update the execution record with Inngest run details and ensure status is RUNNING
              await executionRepo.update(providedExecutionId, {
                status: 'RUNNING',
                inngestRunId: runId,
                inngestEventId: ctx.event.id,
              });

              logger.info('Using existing execution record, status set to RUNNING', {
                context: 'task-interceptor',
                metadata: { functionId, taskId: task.id, executionId },
              });
            } else {
              // Check if execution record already exists for this run (step function replay)
              const existingExecution = await executionRepo.findByInngestRunId(runId);

              if (existingExecution) {
                executionId = existingExecution.id;

                logger.info('Found existing execution record (step replay)', {
                  context: 'task-interceptor',
                  metadata: { functionId, taskId: task.id, executionId, runId },
                });
              } else {
                // Create new execution record for scheduled runs
                const execution = await executionRepo.create({
                  taskId: task.id,
                  inngestRunId: runId,
                  inngestEventId: ctx.event.id,
                  triggeredBy: ctx.event.name.includes('/manual') ? 'MANUAL' : 'SCHEDULE',
                  triggeredByUser: ctx.event.data?.triggeredBy,
                });

                executionId = execution.id;

                logger.info('Execution record created', {
                  context: 'task-interceptor',
                  metadata: { functionId, taskId: task.id, executionId },
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

          // Execution lifecycle hooks
          return {
            transformOutput({ result }) {
              // Track successful completion
              logger.info('transformOutput called', {
                context: 'task-interceptor',
                metadata: { functionId, executionId, runId, hasExecutionId: !!executionId },
              });

              if (executionId) {
                // Mark completed asynchronously (fire and forget for tracking)
                executionRepo.markCompleted(executionId, result.data).catch((err) => {
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
                logger.warn('transformOutput called but executionId is null', {
                  context: 'task-interceptor',
                  metadata: { functionId, runId },
                });
              }

              // Return void to pass through the result unchanged
            },

            finished({ result }) {
              // Track failures using the finished hook
              if (result.error) {
                logger.info('finished hook called with error', {
                  context: 'task-interceptor',
                  metadata: { functionId, executionId, runId, hasExecutionId: !!executionId },
                });

                if (executionId) {
                  const error = result.error;
                  const errorMessage = error instanceof Error ? error.message : String(error);
                  const stackTrace = error instanceof Error ? error.stack : undefined;

                  // Mark failed asynchronously (fire and forget for tracking)
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
                  logger.warn('finished hook called with error but executionId is null', {
                    context: 'task-interceptor',
                    metadata: { functionId, runId },
                  });
                }
              }
            },
          };
        },
      };
    },
  });
