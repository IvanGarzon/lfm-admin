import { Tracer } from '@duke-hq/libtracing';
import type { TaskDefinition } from './index.js';
import type { TaskSchedulerDatabase, TaskRun } from './database/index.js';
import { TaskSchedulerErrorCode } from './errors.js';
import { CronExpressionParser } from 'cron-parser';

export class TaskScheduler {
  private tasks: Map<string, TaskDefinition>;
  private db: TaskSchedulerDatabase;
  private tracer: Tracer;

  constructor(tasks: Record<string, TaskDefinition>, db: TaskSchedulerDatabase) {
    this.tasks = new Map(Object.entries(tasks));
    this.db = db;
    this.tracer = new Tracer('services/scheduled-tasks/src/lib/taskScheduler');
    this.validateTaskCronExpressions();
  }

  private validateTaskCronExpressions(): void {
    for (const [taskName, task] of this.tasks) {
      try {
        CronExpressionParser.parse(task.schedule.cron, {
          tz: task.schedule.timezone ?? 'UTC',
        });
      } catch (error) {
        throw new Error(
          `Invalid cron expression for task "${taskName}": ${task.schedule.cron}. ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }
  }

  async run(): Promise<void> {
    return this.tracer.span('TaskScheduler.run', async (span) => {
      span.log('Starting task scheduler run', { stdout: true });

      const eligibleTasks = await this.findEligibleTasks();

      span.setAttributes({
        'scheduler.eligible_tasks_count': eligibleTasks.length,
        'scheduler.total_tasks_count': this.tasks.size,
      });

      if (eligibleTasks.length === 0) {
        span.log('No eligible tasks found for this run', { stdout: true });
        return;
      }

      span.log(`Found ${eligibleTasks.length} eligible tasks`, {
        stdout: true,
      });

      for (const taskName of eligibleTasks) {
        await this.runTask(taskName);
      }

      span.log('Task scheduler run completed', { stdout: true });
    });
  }

  private async findEligibleTasks(): Promise<string[]> {
    return this.tracer.span('TaskScheduler.findEligibleTasks', async (span) => {
      const now = this.db.getCurrentTime();
      const eligibleTasks: string[] = [];

      for (const [taskName, task] of this.tasks) {
        if (task.schedule.enabled === false) {
          span.log(`Task ${taskName} is disabled, skipping`);
          continue;
        }

        const isEligible = await this.isTaskEligibleToRun(taskName, task, now);

        if (isEligible) {
          eligibleTasks.push(taskName);
        }
      }

      span.setAttributes({
        'scheduler.eligible_tasks': eligibleTasks,
      });

      return eligibleTasks;
    });
  }

  private async isTaskEligibleToRun(
    taskName: string,
    task: TaskDefinition,
    _now: Date,
  ): Promise<boolean> {
    return this.tracer.span('TaskScheduler.isTaskEligibleToRun', async (span) => {
      span.setAttributes({ 'task.name': taskName });

      try {
        const runningRun = await this.getRunningRun(taskName);
        if (runningRun) {
          return false;
        }

        if (task.retryPolicy === 'retry-on-fail') {
          const recentFailedRun = await this.getRecentFailedRun(taskName);
          if (recentFailedRun && (await this.shouldRetryRun(recentFailedRun))) {
            return true;
          }

          if (recentFailedRun) {
            return false;
          }
        }

        return await this.isTimeForNextRun(taskName, task, _now);
      } catch (error) {
        span.recordException(error instanceof Error ? error : new Error(String(error)));
        return false;
      }
    });
  }

  private async isTimeForNextRun(
    taskName: string,
    task: TaskDefinition,
    now: Date,
  ): Promise<boolean> {
    return this.tracer.span('TaskScheduler.isTimeForNextRun', async (span) => {
      span.setAttributes({ 'task.name': taskName });

      try {
        const recentRuns = await this.db.getRecentTaskRun(taskName, new Date(0));

        if (recentRuns.length === 0) {
          return true;
        }

        const sortedRuns = recentRuns.sort(
          (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime(),
        );

        const lastRun = sortedRuns[0];
        if (!lastRun) {
          return true;
        }

        const intervalFromLastRun = CronExpressionParser.parse(task.schedule.cron, {
          currentDate: lastRun.startedAt,
          tz: task.schedule.timezone ?? 'UTC',
        });

        const nextScheduledTimeAfterLastRun = intervalFromLastRun.next().toDate();

        return now.getTime() >= nextScheduledTimeAfterLastRun.getTime();
      } catch (error) {
        span.recordException(error instanceof Error ? error : new Error(String(error)));
        return false;
      }
    });
  }

  private async getRecentFailedRun(taskName: string): Promise<TaskRun | null> {
    const currentTime = this.db.getCurrentTime();
    const oneHourAgo = new Date(currentTime.getTime() - 60 * 60 * 1000);
    const recentRuns = await this.db.getRecentTaskRun(taskName, oneHourAgo);

    const failedRuns = recentRuns.filter(
      (run) => run.status === 'FAILED' && run.errorCode === TaskSchedulerErrorCode.RETRY_SCHEDULED,
    );

    if (failedRuns.length === 0) {
      return null;
    }

    const sortedRuns = failedRuns.sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime());
    return sortedRuns[0] ?? null;
  }

  private async shouldRetryRun(run: TaskRun): Promise<boolean> {
    if (run.status !== 'FAILED' || run.errorCode !== TaskSchedulerErrorCode.RETRY_SCHEDULED) {
      return false;
    }

    const existingRetry = await this.db.findRetryTaskRun(run.id);
    return existingRetry === null;
  }

  private async getRunningRun(taskName: string): Promise<TaskRun | null> {
    return await this.db.findRunningTask(taskName);
  }

  private async runTask(taskName: string): Promise<void> {
    return this.tracer.span(
      { name: `runTask:${taskName}`, suppressExceptions: true },
      async (span) => {
        const task = this.tasks.get(taskName);
        if (!task) {
          throw new Error(`Task not found: ${taskName}`);
        }

        span.setAttributes({
          'task.name': taskName,
          'task.timeout_minutes': task.timeout,
        });

        const lockId = this.generateLockId(taskName);
        let runRecord: TaskRun | null = null;

        try {
          const lockAcquired = await this.acquireTaskLock(lockId);
          if (!lockAcquired) {
            span.log('Task already running (lock not acquired), skipping', {
              stdout: true,
            });
            return;
          }

          span.log(`Acquired task lock for task ${taskName}`);

          const originalFailedRun = await this.getRecentFailedRun(taskName);

          runRecord = await this.createRunRecord(taskName, lockId, originalFailedRun?.id);

          const resultMessage = await this.runTaskWithTimeout(taskName, task);
          span.setAttributes({
            'task.result': resultMessage,
          });

          await this.completeRun(runRecord.id, runRecord.startedAt, resultMessage);

          span.log(`Task ${taskName} completed successfully`, { stdout: true });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);

          if (runRecord) {
            await this.markTaskForRetry(runRecord, taskName, task, errorMessage);
          }

          span.recordException(error instanceof Error ? error : new Error(String(error)));
          span.log(`Task ${taskName} failed with policy ${task.retryPolicy}`, {
            stdout: true,
          });
        } finally {
          await this.releaseTaskLock(lockId);
          span.log(`Released task lock for task ${taskName}`);
        }
      },
    );
  }

  private async runTaskWithTimeout(name: string, task: TaskDefinition): Promise<string> {
    return new Promise((resolve, reject) => {
      const timeoutMs = task.timeout * 60 * 1000;

      const timeoutHandle = setTimeout(() => {
        reject(new Error(`Task ${name} timed out after ${task.timeout} minutes`));
      }, timeoutMs);

      void this.tracer.span(`${name}`, async (taskSpan) => {
        taskSpan.setAttributes({
          'task.name': name,
          'task.timeout_minutes': task.timeout,
        });

        try {
          const result = await task.handler(taskSpan);
          clearTimeout(timeoutHandle);
          resolve(result);
        } catch (error) {
          clearTimeout(timeoutHandle);
          reject(error instanceof Error ? error : new Error(String(error)));
        }
      });
    });
  }

  private generateLockId(taskName: string): bigint {
    let hash = 0;
    for (let i = 0; i < taskName.length; i++) {
      const char = taskName.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }

    return BigInt(Math.abs(hash));
  }

  private async acquireTaskLock(lockId: bigint): Promise<boolean> {
    return await this.db.acquireTaskLock(lockId);
  }

  private async releaseTaskLock(lockId: bigint): Promise<void> {
    await this.db.releaseTaskLock(lockId);
  }

  private async createRunRecord(
    taskName: string,
    lockId: bigint,
    retryOfRunId?: string,
  ): Promise<TaskRun> {
    const currentTime = this.db.getCurrentTime();
    return await this.db.createTaskRun({
      taskName: taskName,
      status: 'RUNNING',
      startedAt: currentTime,
      advisoryLockId: lockId,
      retryOfRunId: retryOfRunId,
    });
  }

  private async completeRun(runId: string, startedAt: Date, resultMessage: string): Promise<void> {
    const completedAt = this.db.getCurrentTime();
    await this.db.updateTaskRun(runId, {
      status: 'COMPLETED',
      completedAt: completedAt,
      durationMs: completedAt.getTime() - startedAt.getTime(),
      resultMessage: resultMessage,
    });
  }

  private async failRun(
    runId: string,
    errorMessage: string,
    errorCode: TaskSchedulerErrorCode,
    startedAt: Date,
  ): Promise<void> {
    const completedAt = this.db.getCurrentTime();
    await this.db.updateTaskRun(runId, {
      status: 'FAILED',
      completedAt: completedAt,
      errorMessage: errorMessage,
      errorCode: errorCode,
      durationMs: completedAt.getTime() - startedAt.getTime(),
    });
  }

  private async markTaskForRetry(
    runRecord: TaskRun,
    taskName: string,
    task: TaskDefinition,
    errorMessage: string,
  ): Promise<void> {
    return this.tracer.span('TaskScheduler.markTaskForRetry', async (failureSpan) => {
      failureSpan.setAttributes({
        'task.name': taskName,
        'task.retry_policy': task.retryPolicy,
        'run.id': runRecord.id,
      });

      if (task.retryPolicy === 'ignore') {
        failureSpan.log('Task failed with ignore policy - marking as failed');
        await this.failRun(
          runRecord.id,
          errorMessage,
          TaskSchedulerErrorCode.TASK_FAILED,
          runRecord.startedAt,
        );
        return;
      }

      if (task.retryPolicy === 'retry-on-fail') {
        failureSpan.log('Task failed with retry-on-fail policy - marking for retry in next run');

        const retryErrorMessage = `${errorMessage} - will retry in next run`;
        await this.failRun(
          runRecord.id,
          retryErrorMessage,
          TaskSchedulerErrorCode.RETRY_SCHEDULED,
          runRecord.startedAt,
        );
      }
    });
  }
}
