import { TaskExecution, PrismaClient, ExecutionStatus, TriggerSource } from '@/prisma/client';

/**
 * TaskExecution Repository
 * Handles all database operations for task executions
 */
export class TaskExecutionRepository {
  constructor(private prisma: PrismaClient) {}

  /**
   * Retrieves all execution records for a specific scheduled task.
   * Supports pagination and status-based filtering.
   * @param taskId - The ID of the scheduled task
   * @param options - Pagination and filter configuration
   * @param options.limit - Maximum number of records to return
   * @param options.offset - Number of records to skip
   * @param options.status - Optional status filter (RUNNING, COMPLETED, FAILED)
   * @returns A promise that resolves to an array of task executions
   */
  async findByTaskId(
    taskId: string,
    options?: {
      limit?: number;
      offset?: number;
      status?: ExecutionStatus;
    },
  ): Promise<TaskExecution[]> {
    return this.prisma.taskExecution.findMany({
      where: {
        taskId,
        ...(options?.status && { status: options.status }),
      },
      orderBy: {
        startedAt: 'desc',
      },
      take: options?.limit,
      skip: options?.offset,
    });
  }

  /**
   * Find a specific task execution by its unique ID.
   * @param id - The ID of the execution record
   * @returns A promise that resolves to the execution or null if not found
   */
  async findById(id: string): Promise<TaskExecution | null> {
    return this.prisma.taskExecution.findUnique({
      where: { id },
    });
  }

  /**
   * Locate a task execution record by its Inngest run identifier.
   * Useful for tracking executions managed by Inngest.
   * @param inngestRunId - The unique Inngest run ID
   * @returns A promise that resolves to the execution or null if not found
   */
  async findByInngestRunId(inngestRunId: string): Promise<TaskExecution | null> {
    return this.prisma.taskExecution.findUnique({
      where: { inngestRunId },
    });
  }

  /**
   * Initialize a new task execution record.
   * Typically called at the beginning of a task run.
   * @param data - Initial execution state and metadata
   * @returns A promise that resolves to the newly created execution record
   */
  async create(data: {
    taskId: string;
    status?: ExecutionStatus;
    triggeredBy?: TriggerSource;
    triggeredByUser?: string;
    inngestRunId?: string;
    inngestEventId?: string;
    startedAt?: Date;
  }): Promise<TaskExecution> {
    return this.prisma.taskExecution.create({
      data: {
        taskId: data.taskId,
        status: data.status || 'RUNNING',
        triggeredBy: data.triggeredBy || 'SCHEDULE',
        triggeredByUser: data.triggeredByUser,
        inngestRunId: data.inngestRunId,
        inngestEventId: data.inngestEventId,
        startedAt: data.startedAt || new Date(),
      },
    });
  }

  /**
   * Update an ongoing or finished task execution record with new data.
   * @param id - The ID of the execution to update
   * @param data - The update payload containing status, results, or error info
   * @returns A promise that resolves to the updated execution record
   */
  async update(
    id: string,
    data: {
      status?: ExecutionStatus;
      completedAt?: Date;
      duration?: number;
      result?: any;
      error?: string;
      stackTrace?: string;
      retryCount?: number;
      steps?: any;
      inngestRunId?: string;
      inngestEventId?: string;
    },
  ): Promise<TaskExecution> {
    return this.prisma.taskExecution.update({
      where: { id },
      data,
    });
  }

  /**
   * Mark a task execution as successfully completed.
   * Automatically calculates duration and updates the status.
   * @param id - The unique ID of the execution
   * @param result - Optional result payload from the task
   * @returns A promise that resolves to the finalized execution record
   */
  async markCompleted(id: string, result?: any): Promise<TaskExecution> {
    const completedAt = new Date();
    const execution = await this.findById(id);
    const duration = execution ? completedAt.getTime() - execution.startedAt.getTime() : null;

    return this.prisma.taskExecution.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        completedAt,
        duration: duration || undefined,
        result,
      },
    });
  }

  /**
   * Mark a task execution as failed.
   * Captures error details and calculates final duration.
   * @param id - The unique ID of the execution
   * @param error - Human-readable error message
   * @param stackTrace - Optional technical stack trace for debugging
   * @returns A promise that resolves to the finalized execution record
   */
  async markFailed(id: string, error: string, stackTrace?: string): Promise<TaskExecution> {
    const completedAt = new Date();
    const execution = await this.findById(id);
    const duration = execution ? completedAt.getTime() - execution.startedAt.getTime() : null;

    return this.prisma.taskExecution.update({
      where: { id },
      data: {
        status: 'FAILED',
        completedAt,
        duration: duration || undefined,
        error,
        stackTrace,
      },
    });
  }

  /**
   * Calculates high-level metrics for a specific task's history.
   * Provides counts for status types and average performance.
   * @param taskId - The ID of the scheduled task
   * @param since - Optional cutoff date for the statistics
   * @returns A promise that resolves to an object containing execution metadata
   */
  async getStats(
    taskId: string,
    since?: Date,
  ): Promise<{
    total: number;
    completed: number;
    failed: number;
    running: number;
    avgDuration: number | null;
  }> {
    const executions = await this.prisma.taskExecution.findMany({
      where: {
        taskId,
        ...(since && { startedAt: { gte: since } }),
      },
      select: {
        status: true,
        duration: true,
      },
    });

    const total = executions.length;
    const completed = executions.filter((e) => e.status === 'COMPLETED').length;
    const failed = executions.filter((e) => e.status === 'FAILED').length;
    const running = executions.filter((e) => e.status === 'RUNNING').length;

    const durations = executions.filter((e) => e.duration !== null).map((e) => e.duration!);
    const avgDuration =
      durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : null;

    return {
      total,
      completed,
      failed,
      running,
      avgDuration,
    };
  }

  /**
   * Fetch the most recent execution records across all platform tasks.
   * Includes task definition details for context.
   * @param limit - Maximum number of recent records to retrieve
   * @returns A promise that resolves to an array of recent executions
   */
  async findRecent(limit: number = 10): Promise<
    (TaskExecution & {
      task: {
        id: string;
        functionName: string;
        category: string;
      };
    })[]
  > {
    return this.prisma.taskExecution.findMany({
      take: limit,
      orderBy: {
        startedAt: 'desc',
      },
      include: {
        task: {
          select: {
            id: true,
            functionName: true,
            category: true,
          },
        },
      },
    });
  }

  /**
   * Retrieves all executions that are currently in a 'RUNNING' state.
   * Useful for monitoring active platform load.
   * @returns A promise that resolves to an array of active executions
   */
  async findRunning(): Promise<TaskExecution[]> {
    return this.prisma.taskExecution.findMany({
      where: {
        status: 'RUNNING',
      },
      orderBy: {
        startedAt: 'desc',
      },
    });
  }

  /**
   * Purges historical execution records to manage database size.
   * Only deletes finished tasks (non-RUNNING).
   * @param olderThan - Date threshold; records older than this will be removed
   * @returns A promise that resolves to the count of deleted records
   */
  async deleteOldExecutions(olderThan: Date): Promise<number> {
    const result = await this.prisma.taskExecution.deleteMany({
      where: {
        startedAt: {
          lt: olderThan,
        },
        status: {
          not: 'RUNNING',
        },
      },
    });

    return result.count;
  }

  /**
   * Manually increments the retry counter for a specific execution.
   * Useful for tasks that involve external webhook or API retries.
   * @param id - The unique ID of the execution record
   * @returns A promise that resolves to the updated execution record
   * @throws {Error} If the execution record is not found
   */
  async incrementRetryCount(id: string): Promise<TaskExecution> {
    const execution = await this.findById(id);
    if (!execution) {
      throw new Error('Execution not found');
    }

    return this.prisma.taskExecution.update({
      where: { id },
      data: {
        retryCount: execution.retryCount + 1,
      },
    });
  }
}
