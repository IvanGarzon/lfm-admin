import { cuid2 } from '@duke-hq/id';
import type {
  TaskSchedulerDatabase,
  TaskRun,
  CreateTaskRunData,
  UpdateTaskRunData,
} from '../database/interface.js';

const DEFAULT_DATE = new Date('1/1/2000');

export class MockTaskSchedulerDatabase implements TaskSchedulerDatabase {
  private runs: Map<string, TaskRun> = new Map();
  private advisoryLocks: Set<string> = new Set();
  private mockedCurrentTime: Date = DEFAULT_DATE;

  findRunningTask(taskName: string): Promise<TaskRun | null> {
    for (const run of this.runs.values()) {
      if (run.taskName === taskName && run.status === 'RUNNING') {
        return Promise.resolve({ ...run });
      }
    }
    return Promise.resolve(null);
  }

  createTaskRun(data: CreateTaskRunData): Promise<TaskRun> {
    const run: TaskRun = {
      id: cuid2(),
      taskName: data.taskName,
      status: data.status,
      startedAt: new Date(data.startedAt),
      advisoryLockId: data.advisoryLockId,
      retryOfRunId: data.retryOfRunId,
    };

    this.runs.set(run.id, run);
    return Promise.resolve({ ...run });
  }

  updateTaskRun(id: string, data: UpdateTaskRunData): Promise<TaskRun> {
    const run = this.runs.get(id);
    if (!run) {
      throw new Error(`Run with id ${id} not found`);
    }

    const updatedRun: TaskRun = {
      ...run,
      ...data,
    };

    this.runs.set(id, updatedRun);
    return Promise.resolve({ ...updatedRun });
  }

  acquireTaskLock(lockId: bigint): Promise<boolean> {
    const lockKey = lockId.toString();

    if (this.advisoryLocks.has(lockKey)) {
      return Promise.resolve(false);
    }

    this.advisoryLocks.add(lockKey);
    return Promise.resolve(true);
  }

  releaseTaskLock(lockId: bigint): Promise<void> {
    const lockKey = lockId.toString();
    this.advisoryLocks.delete(lockKey);
    return Promise.resolve();
  }

  findRetryTaskRun(originalRunId: string): Promise<TaskRun | null> {
    for (const run of this.runs.values()) {
      if (run.retryOfRunId === originalRunId) {
        return Promise.resolve({ ...run });
      }
    }
    return Promise.resolve(null);
  }

  getRecentTaskRun(taskName: string, since: Date): Promise<TaskRun[]> {
    const recentRuns = Array.from(this.runs.values())
      .filter((run) => run.taskName === taskName && run.startedAt >= since)
      .map((e) => ({ ...e }));

    return Promise.resolve(recentRuns);
  }

  getCurrentTime(): Date {
    return this.mockedCurrentTime;
  }

  disconnect(): Promise<void> {
    this.runs.clear();
    this.advisoryLocks.clear();
    return Promise.resolve();
  }

  getAllRuns(): TaskRun[] {
    return Array.from(this.runs.values()).map((e) => ({ ...e }));
  }

  getRunsForTask(taskName: string): TaskRun[] {
    return Array.from(this.runs.values())
      .filter((e) => e.taskName === taskName)
      .map((e) => ({ ...e }));
  }

  isLockHeld(lockId: bigint): boolean {
    return this.advisoryLocks.has(lockId.toString());
  }

  reset(): void {
    this.runs.clear();
    this.advisoryLocks.clear();
    this.mockedCurrentTime = DEFAULT_DATE;
  }

  setMockedCurrentTime(time: Date): void {
    this.mockedCurrentTime = time;
  }

  setTime(time: Date): void {
    this.mockedCurrentTime = time;
  }

  clearMockedCurrentTime(): void {
    this.mockedCurrentTime = DEFAULT_DATE;
  }

  now(): Date {
    return this.mockedCurrentTime;
  }

  advanceTime(milliseconds: number): void {
    this.mockedCurrentTime = new Date(this.mockedCurrentTime.getTime() + milliseconds);
  }

  advanceHours(hours: number): void {
    this.advanceTime(hours * 60 * 60 * 1000);
  }

  advanceDays(days: number): void {
    this.advanceTime(days * 24 * 60 * 60 * 1000);
  }

  setTaskAsRunning(taskName: string, lockId?: bigint): TaskRun {
    const actualLockId = lockId ?? BigInt(12345);
    const run: TaskRun = {
      id: cuid2(),
      taskName: taskName,
      status: 'RUNNING',
      startedAt: this.mockedCurrentTime,
      advisoryLockId: actualLockId,
    };

    this.runs.set(run.id, run);
    this.advisoryLocks.add(actualLockId.toString());
    return run;
  }

  setAllLocksBlocked(): void {
    this.acquireTaskLock = () => Promise.resolve(false);
  }

  restoreNormalLockBehavior(): void {
    this.acquireTaskLock = (lockId: bigint): Promise<boolean> => {
      const lockKey = lockId.toString();
      if (this.advisoryLocks.has(lockKey)) {
        return Promise.resolve(false);
      }
      this.advisoryLocks.add(lockKey);
      return Promise.resolve(true);
    };
  }

  getRunCountByStatus(status: 'RUNNING' | 'COMPLETED' | 'FAILED' | 'TIMEOUT'): number {
    return Array.from(this.runs.values()).filter((e) => e.status === status).length;
  }

  getMostRecentRun(taskName: string): TaskRun | null {
    const taskRuns = this.getRunsForTask(taskName);
    if (taskRuns.length === 0) {
      return null;
    }

    return taskRuns.reduce((latest, current) =>
      current.startedAt > latest.startedAt ? current : latest,
    );
  }

  simulateError(
    operation: 'findRunning' | 'create' | 'update' | 'acquireLock' | 'releaseLock',
  ): void {
    const errorMethod = () =>
      Promise.reject(new Error(`Simulated database error for ${operation}`));

    switch (operation) {
      case 'findRunning': {
        const original = this.findRunningTask.bind(this);
        this.findRunningTask = errorMethod;
        setTimeout(() => {
          this.findRunningTask = original;
        }, 0);
        break;
      }
      case 'create': {
        const original = this.createTaskRun.bind(this);
        this.createTaskRun = errorMethod;
        setTimeout(() => {
          this.createTaskRun = original;
        }, 0);
        break;
      }
      case 'update': {
        const original = this.updateTaskRun.bind(this);
        this.updateTaskRun = errorMethod;
        setTimeout(() => {
          this.updateTaskRun = original;
        }, 0);
        break;
      }
      case 'acquireLock': {
        const original = this.acquireTaskLock.bind(this);
        this.acquireTaskLock = errorMethod;
        setTimeout(() => {
          this.acquireTaskLock = original;
        }, 0);
        break;
      }
      case 'releaseLock': {
        const original = this.releaseTaskLock.bind(this);
        this.releaseTaskLock = errorMethod;
        setTimeout(() => {
          this.releaseTaskLock = original;
        }, 0);
        break;
      }
      default:
        throw new Error(`Unknown operation: ${String(operation)}`);
    }
  }
}
