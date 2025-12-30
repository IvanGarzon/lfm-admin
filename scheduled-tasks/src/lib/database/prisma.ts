import type {
  PrismaClient,
  ScheduledTaskRun as ScheduledTaskRun,
} from '@duke-hq/svc-api-db/client';
import type {
  TaskSchedulerDatabase,
  TaskRun,
  TaskRunStatus,
  CreateTaskRunData,
  UpdateTaskRunData,
} from './interface.js';
import { Tracer } from '@duke-hq/libtracing';

const tracer = new Tracer('services/scheduled-tasks/src/lib/database/prisma');

export class PrismaTaskSchedulerDatabase implements TaskSchedulerDatabase {
  constructor(private prisma: PrismaClient) {}

  async findRunningTask(taskName: string): Promise<TaskRun | null> {
    return await tracer.span('findRunningTask', async () => {
      const run = await this.prisma.scheduledTaskRun.findFirst({
        where: {
          taskName: taskName,
          status: 'RUNNING',
        },
        orderBy: {
          startedAt: 'desc',
        },
      });

      if (!run) {
        return null;
      }

      return this.mapPrismaRecordToTaskRun(run);
    });
  }

  async createTaskRun(data: CreateTaskRunData): Promise<TaskRun> {
    return await tracer.span('createTaskRun', async (span) => {
      const run = await this.prisma.scheduledTaskRun.create({
        data: {
          taskName: data.taskName,
          status: data.status,
          startedAt: data.startedAt,
          advisoryLockId: data.advisoryLockId,
          traceId: span.traceId(),
        },
      });

      return this.mapPrismaRecordToTaskRun(run);
    });
  }

  async updateTaskRun(id: string, data: UpdateTaskRunData): Promise<TaskRun> {
    return await tracer.span('updateTaskRun', async () => {
      const run = await this.prisma.scheduledTaskRun.update({
        where: { id },
        data: {
          status: data.status,
          completedAt: data.completedAt,
          durationMs: data.durationMs,
          errorMessage: data.errorMessage,
          resultMessage: data.resultMessage,
        },
      });

      return this.mapPrismaRecordToTaskRun(run);
    });
  }

  async acquireTaskLock(lockId: bigint): Promise<boolean> {
    return await tracer.span('acquireTaskLock', async (span) => {
      try {
        const result = await this.prisma.$queryRaw<[{ pg_try_advisory_lock: boolean }]>`
          SELECT pg_try_advisory_lock(${lockId})
        `;
        return result[0].pg_try_advisory_lock;
      } catch (error) {
        span.error(error);
        return false;
      }
    });
  }

  async releaseTaskLock(lockId: bigint): Promise<void> {
    return await tracer.span('releaseTaskLock', async (span) => {
      try {
        await this.prisma.$queryRaw`SELECT pg_advisory_unlock(${lockId})`;
      } catch (error) {
        span.error(error);
      }
    });
  }

  async findRetryTaskRun(_originalRunId: string): Promise<TaskRun | null> {
    return Promise.resolve(null);
  }

  async getRecentTaskRun(taskName: string, since: Date): Promise<TaskRun[]> {
    return await tracer.span('getRecentTaskRun', async () => {
      const executions = await this.prisma.scheduledTaskRun.findMany({
        where: {
          taskName: taskName,
          startedAt: {
            gte: since,
          },
        },
        orderBy: {
          startedAt: 'desc',
        },
      });

      return executions.map((run) => this.mapPrismaRecordToTaskRun(run));
    });
  }

  getCurrentTime(): Date {
    return new Date();
  }

  async disconnect(): Promise<void> {
    await this.prisma.$disconnect();
  }

  private mapPrismaRecordToTaskRun(record: ScheduledTaskRun): TaskRun {
    return {
      id: record.id,
      taskName: record.taskName,
      status: record.status satisfies TaskRunStatus,
      startedAt: record.startedAt,
      completedAt: record.completedAt ?? undefined,
      durationMs: record.durationMs ?? undefined,
      errorMessage: record.errorMessage ?? undefined,
      resultMessage: record.resultMessage ?? undefined,
      advisoryLockId: record.advisoryLockId ?? undefined,
      retryOfRunId: undefined,
    };
  }
}
