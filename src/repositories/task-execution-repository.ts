import { TaskExecution, PrismaClient, ExecutionStatus, TriggerSource } from '@/prisma/client';

/**
 * TaskExecution Repository
 * Handles all database operations for task executions
 */
export class TaskExecutionRepository {
  constructor(private prisma: PrismaClient) {}

  /**
   * Find all executions for a specific task
   * @param taskId - The ID of the scheduled task
   * @param options - Optional pagination and filters
   * @returns Array of task executions
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
   * Find an execution by ID
   * @param id - The ID of the execution
   * @returns The execution or null if not found
   */
  async findById(id: string): Promise<TaskExecution | null> {
    return this.prisma.taskExecution.findUnique({
      where: { id },
    });
  }

  /**
   * Find an execution by Inngest run ID
   * @param inngestRunId - The Inngest run ID
   * @returns The execution or null if not found
   */
  async findByInngestRunId(inngestRunId: string): Promise<TaskExecution | null> {
    return this.prisma.taskExecution.findUnique({
      where: { inngestRunId },
    });
  }

  /**
   * Create a new task execution
   * @param data - The execution data
   * @returns The created execution
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
   * Update an execution
   * @param id - The ID of the execution
   * @param data - The fields to update
   * @returns The updated execution
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
   * Mark an execution as completed
   * @param id - The ID of the execution
   * @param result - The execution result
   * @returns The updated execution
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
   * Mark an execution as failed
   * @param id - The ID of the execution
   * @param error - The error message
   * @param stackTrace - The error stack trace
   * @returns The updated execution
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
   * Get execution statistics for a task
   * @param taskId - The ID of the scheduled task
   * @param since - Optional date to filter executions since
   * @returns Execution statistics
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
   * Get recent executions across all tasks
   * @param limit - Number of executions to return
   * @returns Array of recent executions with task info
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
   * Get all running executions
   * @returns Array of running executions
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
   * Delete old execution records
   * @param olderThan - Delete executions older than this date
   * @returns Count of deleted executions
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
   * Increment retry count for an execution
   * @param id - The ID of the execution
   * @returns The updated execution
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
