import { ScheduledTask, PrismaClient, TaskCategory, ScheduleType } from '@/prisma/client';

/**
 * ScheduledTask Repository
 * Handles all database operations for scheduled tasks
 */
export class ScheduledTaskRepository {
  constructor(private prisma: PrismaClient) {}

  /**
   * Find all scheduled tasks with optional filtering.
   * @param filters - Optional filters for category, enabled status, and schedule type
   * @param filters.category - Filter by task category
   * @param filters.isEnabled - Filter by active/inactive status
   * @param filters.scheduleType - Filter by trigger type (CRON, EVENT, etc.)
   * @returns A promise that resolves to an array of scheduled tasks
   */
  async findAll(filters?: {
    category?: TaskCategory;
    isEnabled?: boolean;
    scheduleType?: ScheduleType;
  }): Promise<ScheduledTask[]> {
    return this.prisma.scheduledTask.findMany({
      where: {
        ...(filters?.category && { category: filters.category }),
        ...(filters?.isEnabled !== undefined && { isEnabled: filters.isEnabled }),
        ...(filters?.scheduleType && { scheduleType: filters.scheduleType }),
      },
      orderBy: {
        category: 'asc',
      },
    });
  }

  /**
   * Find a scheduled task by its unique database ID.
   * @param id - The ID of the task
   * @returns A promise that resolves to the task or null if not found
   */
  async findById(id: string): Promise<ScheduledTask | null> {
    return this.prisma.scheduledTask.findUnique({
      where: { id },
    });
  }

  /**
   * Find a scheduled task by its Inngest function ID.
   * Useful for syncing definitions from code to database.
   * @param functionId - The unique Inngest function ID
   * @returns A promise that resolves to the task or null if not found
   */
  async findByFunctionId(functionId: string): Promise<ScheduledTask | null> {
    return this.prisma.scheduledTask.findUnique({
      where: { functionId },
    });
  }

  /**
   * Create or update a scheduled task definition (upsert).
   * Used for synchronizing Inngest function definitions with the database.
   * @param data - The task configuration data
   * @returns A promise that resolves to the created or updated task
   */
  async upsert(data: {
    functionId: string;
    functionName: string;
    description?: string;
    scheduleType: ScheduleType;
    cronSchedule?: string;
    eventName?: string;
    category: TaskCategory;
    retries?: number;
    concurrencyLimit?: number;
    timeout?: number;
    metadata?: any;
    codeVersion?: string;
  }): Promise<ScheduledTask> {
    return this.prisma.scheduledTask.upsert({
      where: { functionId: data.functionId },
      create: {
        functionId: data.functionId,
        functionName: data.functionName,
        description: data.description,
        scheduleType: data.scheduleType,
        cronSchedule: data.cronSchedule,
        eventName: data.eventName,
        category: data.category,
        retries: data.retries,
        concurrencyLimit: data.concurrencyLimit,
        timeout: data.timeout,
        metadata: data.metadata,
        codeVersion: data.codeVersion,
        lastSyncedAt: new Date(),
      },
      update: {
        functionName: data.functionName,
        description: data.description,
        scheduleType: data.scheduleType,
        cronSchedule: data.cronSchedule,
        eventName: data.eventName,
        category: data.category,
        retries: data.retries,
        concurrencyLimit: data.concurrencyLimit,
        timeout: data.timeout,
        metadata: data.metadata,
        codeVersion: data.codeVersion,
        lastSyncedAt: new Date(),
      },
    });
  }

  /**
   * Update specific fields of a task configuration.
   * @param id - The unique ID of the task
   * @param data - The fields to update (isEnabled, schedule, etc.)
   * @returns A promise that resolves to the updated task
   */
  async update(
    id: string,
    data: {
      isEnabled?: boolean;
      cronSchedule?: string;
      retries?: number;
      concurrencyLimit?: number;
      timeout?: number;
      metadata?: any;
    },
  ): Promise<ScheduledTask> {
    return this.prisma.scheduledTask.update({
      where: { id },
      data,
    });
  }

  /**
   * Quickly enable or disable a scheduled task.
   * @param id - The unique ID of the task
   * @param isEnabled - Desired enabled status
   * @returns A promise that resolves to the updated task
   */
  async setEnabled(id: string, isEnabled: boolean): Promise<ScheduledTask> {
    return this.prisma.scheduledTask.update({
      where: { id },
      data: { isEnabled },
    });
  }

  /**
   * Retrieves a task along with its execution statistics.
   * Includes total execution count and the most recent execution details.
   * @param id - The unique ID of the task
   * @returns A promise that resolves to the task with execution stats or null if not found
   */
  async findByIdWithStats(id: string): Promise<
    | (ScheduledTask & {
        _count: { executions: number };
        lastExecution?: {
          id: string;
          status: string;
          startedAt: Date;
          completedAt: Date | null;
        } | null;
      })
    | null
  > {
    const task = await this.prisma.scheduledTask.findUnique({
      where: { id },
      include: {
        _count: {
          select: { executions: true },
        },
        executions: {
          take: 1,
          orderBy: { startedAt: 'desc' },
          select: {
            id: true,
            status: true,
            startedAt: true,
            completedAt: true,
          },
        },
      },
    });

    if (!task) {
      return null;
    }

    const { executions, ...taskData } = task;

    return {
      ...taskData,
      lastExecution: executions[0] || null,
    };
  }

  /**
   * Permanently deletes a scheduled task definition.
   * @param id - The unique ID of the task to delete
   * @returns A promise that resolves to the deleted task record
   */
  async delete(id: string): Promise<ScheduledTask> {
    return this.prisma.scheduledTask.delete({
      where: { id },
    });
  }

  /**
   * Aggregates task counts grouped by their category.
   * @returns A promise that resolves to an object mapping categories to task counts
   */
  async countByCategory(): Promise<Record<TaskCategory, number>> {
    const counts = await this.prisma.scheduledTask.groupBy({
      by: ['category'],
      _count: true,
    });

    const result = {} as Record<TaskCategory, number>;
    counts.forEach((item) => {
      result[item.category] = item._count;
    });

    return result;
  }

  /**
   * Retrieves all tasks that are currently marked as enabled.
   * Useful for internal scheduler logic.
   * @returns A promise that resolves to an array of enabled tasks
   */
  async findAllEnabled(): Promise<ScheduledTask[]> {
    return this.prisma.scheduledTask.findMany({
      where: { isEnabled: true },
      orderBy: { category: 'asc' },
    });
  }

  /**
   * Find all scheduled tasks with integrated execution statistics.
   * Includes execution count and the single most recent execution for each task.
   * @param filters - Optional filters for the task list
   * @returns A promise that resolves to an array of tasks with execution summaries
   */
  async findAllWithStats(filters?: {
    category?: TaskCategory;
    isEnabled?: boolean;
    scheduleType?: ScheduleType;
  }): Promise<
    (ScheduledTask & {
      _count: { executions: number };
      lastExecution?: {
        id: string;
        status: string;
        startedAt: Date;
        completedAt: Date | null;
        triggeredByUser: string | null;
        user?: {
          firstName: string;
          lastName: string;
          email: string | null;
        } | null;
      } | null;
    })[]
  > {
    const tasks = await this.prisma.scheduledTask.findMany({
      where: {
        ...(filters?.category && { category: filters.category }),
        ...(filters?.isEnabled !== undefined && { isEnabled: filters.isEnabled }),
        ...(filters?.scheduleType && { scheduleType: filters.scheduleType }),
      },
      include: {
        _count: {
          select: { executions: true },
        },
        executions: {
          take: 1,
          orderBy: { startedAt: 'desc' },
          select: {
            id: true,
            status: true,
            startedAt: true,
            completedAt: true,
            triggeredByUser: true,
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: {
        category: 'asc',
      },
    });

    return tasks.map((task) => ({
      ...task,
      lastExecution: task.executions[0] || null,
      executions: undefined as any,
    }));
  }
}
