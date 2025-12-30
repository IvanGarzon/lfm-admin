import { ScheduledTask, PrismaClient, TaskCategory, ScheduleType } from '@/prisma/client';

/**
 * ScheduledTask Repository
 * Handles all database operations for scheduled tasks
 */
export class ScheduledTaskRepository {
  constructor(private prisma: PrismaClient) {}

  /**
   * Find all scheduled tasks
   * @param filters - Optional filters for category, enabled status, etc.
   * @returns Array of scheduled tasks
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
   * Find a scheduled task by ID
   * @param id - The ID of the task
   * @returns The task or null if not found
   */
  async findById(id: string): Promise<ScheduledTask | null> {
    return this.prisma.scheduledTask.findUnique({
      where: { id },
    });
  }

  /**
   * Find a scheduled task by function ID
   * @param functionId - The Inngest function ID
   * @returns The task or null if not found
   */
  async findByFunctionId(functionId: string): Promise<ScheduledTask | null> {
    return this.prisma.scheduledTask.findUnique({
      where: { functionId },
    });
  }

  /**
   * Create or update a scheduled task (upsert)
   * @param data - The task data
   * @returns The created or updated task
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
   * Update task configuration
   * @param id - The ID of the task
   * @param data - The fields to update
   * @returns The updated task
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
   * Enable or disable a task
   * @param id - The ID of the task
   * @param isEnabled - Whether the task should be enabled
   * @returns The updated task
   */
  async setEnabled(id: string, isEnabled: boolean): Promise<ScheduledTask> {
    return this.prisma.scheduledTask.update({
      where: { id },
      data: { isEnabled },
    });
  }

  /**
   * Get task with execution statistics
   * @param id - The ID of the task
   * @returns The task with execution stats or null if not found
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

    if (!task) return null;

    return {
      ...task,
      lastExecution: task.executions[0] || null,
      executions: undefined as any, // Remove from result
    };
  }

  /**
   * Delete a scheduled task
   * @param id - The ID of the task
   * @returns The deleted task
   */
  async delete(id: string): Promise<ScheduledTask> {
    return this.prisma.scheduledTask.delete({
      where: { id },
    });
  }

  /**
   * Count tasks by category
   * @returns Object with counts per category
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
   * Get all enabled tasks
   * @returns Array of enabled tasks
   */
  async findAllEnabled(): Promise<ScheduledTask[]> {
    return this.prisma.scheduledTask.findMany({
      where: { isEnabled: true },
      orderBy: { category: 'asc' },
    });
  }

  /**
   * Find all scheduled tasks with execution statistics
   * @param filters - Optional filters for category, enabled status, etc.
   * @returns Array of tasks with last execution info
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
