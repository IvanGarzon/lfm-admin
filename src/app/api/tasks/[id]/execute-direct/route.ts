/**
 * Direct Task Execution API Route
 * POST /api/tasks/[id]/execute-direct - Execute task directly without Inngest events
 *
 * This endpoint executes tasks directly by calling their handlers,
 * bypassing Inngest's event system. This is useful for manual triggers
 * and doesn't require INNGEST_EVENT_KEY configuration.
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { ScheduledTaskRepository } from '@/repositories/scheduled-task-repository';
import { TaskExecutionRepository } from '@/repositories/task-execution-repository';
import { getTaskById } from '@/tasks';

const taskRepo = new ScheduledTaskRepository(prisma);
const executionRepo = new TaskExecutionRepository(prisma);

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: taskDbId } = await params;
    const body = await request.json();
    const { userId } = body;

    // Get task from database
    const dbTask = await taskRepo.findById(taskDbId);
    if (!dbTask) {
      return NextResponse.json({ success: false, error: 'Task not found' }, { status: 404 });
    }

    if (!dbTask.isEnabled) {
      return NextResponse.json({ success: false, error: 'Task is disabled' }, { status: 400 });
    }

    // Get task definition
    const taskDef = getTaskById(dbTask.functionId);
    if (!taskDef) {
      return NextResponse.json(
        { success: false, error: 'Task definition not found' },
        { status: 404 },
      );
    }

    logger.info('Executing task directly', {
      context: 'task-execute-direct',
      metadata: {
        taskId: taskDbId,
        functionId: dbTask.functionId,
        userId,
      },
    });

    // Create execution record
    const execution = await executionRepo.create({
      taskId: taskDbId,
      triggeredBy: 'MANUAL',
      triggeredByUser: userId,
    });

    // Execute task in background
    executeTaskInBackground(execution.id, taskDef, dbTask.functionId);

    return NextResponse.json({
      success: true,
      message: 'Task execution started',
      data: {
        executionId: execution.id,
        taskId: taskDbId,
      },
    });
  } catch (error) {
    logger.error('Failed to execute task directly', error, {
      context: 'task-execute-direct',
    });

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to execute task',
      },
      { status: 500 },
    );
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
    // Note: This assumes the Inngest function has a specific structure
    // We'll need to extract the actual handler from the Inngest function
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
  // Try to access the function's trigger handler
  // Inngest functions store their handler in a specific way
  // This is a bit of a hack but works for our use case

  const fnConfig = (inngestFn as any)._def || (inngestFn as any).config || {};
  const handler = fnConfig.fn || fnConfig.handler;

  if (!handler) {
    throw new Error('Could not find function handler');
  }

  // Call the handler with mock context
  // The handler expects ({ event, step }) but for direct execution
  // we'll provide minimal mocks
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
