import { describe, it, expect, beforeEach } from 'vitest';
import { TaskScheduler } from '../taskScheduler.js';
import { MockTaskSchedulerDatabase } from './mock.js';
import type { TaskDefinition } from '../index.js';

describe('Retry Policy Tests', () => {
  let mockDb: MockTaskSchedulerDatabase;

  beforeEach(() => {
    mockDb = new MockTaskSchedulerDatabase();
  });

  describe('retry-on-fail policy', () => {
    it('should mark failed task for retry in next run', async () => {
      let attemptCount = 0;
      const failingTask: TaskDefinition = {
        schedule: { cron: '0 0 * * *' },
        timeout: 5,
        retryPolicy: 'retry-on-fail',
        handler: () => {
          attemptCount++;
          throw new Error('Task failed');
        },
      };

      const scheduler = new TaskScheduler({ failingTask }, mockDb);

      await scheduler.run();

      expect(attemptCount).toBe(1);

      const runs = mockDb.getAllRuns();
      expect(runs).toHaveLength(1);

      const run = runs[0];
      expect(run).toBeDefined();
      if (run) {
        expect(run.status).toBe('FAILED');
        expect(run.errorMessage).toContain('will retry in next run');
        expect(run.retryOfRunId).toBeUndefined();
      }
    });

    it('should eventually succeed when task succeeds on retry', async () => {
      let attemptCount = 0;
      const eventuallySucceedingTask: TaskDefinition = {
        schedule: { cron: '0 0 * * *' },
        timeout: 5,
        retryPolicy: 'retry-on-fail',
        handler: () => {
          attemptCount++;
          if (attemptCount === 1) {
            throw new Error('First attempt failed');
          }
          const result = 5 + 5;
          return Promise.resolve(`Task completed: 5 + 5 = ${result}`);
        },
      };

      const scheduler = new TaskScheduler({ eventuallySucceedingTask }, mockDb);

      await scheduler.run();
      expect(attemptCount).toBe(1);

      let runs = mockDb.getAllRuns();
      expect(runs).toHaveLength(1);
      expect(runs[0]?.status).toBe('FAILED');
      expect(runs[0]?.errorMessage).toContain('will retry in next run');

      await scheduler.run();
      expect(attemptCount).toBe(2);

      runs = mockDb.getAllRuns();
      expect(runs).toHaveLength(2);
    });

    it('should not retry tasks with ignore policy', async () => {
      let attemptCount = 0;
      const ignoreTask: TaskDefinition = {
        schedule: { cron: '0 0 * * *' },
        timeout: 5,
        retryPolicy: 'ignore',
        handler: () => {
          attemptCount++;
          throw new Error('Task failed');
        },
      };

      const scheduler = new TaskScheduler({ ignoreTask }, mockDb);

      await scheduler.run();
      expect(attemptCount).toBe(1);

      const runs = mockDb.getAllRuns();
      expect(runs).toHaveLength(1);

      const run = runs[0];
      expect(run).toBeDefined();
      if (run) {
        expect(run.status).toBe('FAILED');
        expect(run.errorMessage).toBe('Task failed');
        expect(run.errorMessage).not.toContain('will retry');
      }

      // Advance time by 24+ hours to make the daily task eligible again
      mockDb.advanceDays(1);

      await scheduler.run();
      expect(attemptCount).toBe(2);

      const allRuns = mockDb.getAllRuns();
      expect(allRuns).toHaveLength(2);
    });

    it('should handle successful tasks normally', async () => {
      let attemptCount = 0;
      const successTask: TaskDefinition = {
        schedule: { cron: '0 0 * * *' },
        timeout: 5,
        retryPolicy: 'retry-on-fail',
        handler: () => {
          attemptCount++;
          const result = 5 + 5;
          return Promise.resolve(`Task completed: 5 + 5 = ${result}`);
        },
      };

      const scheduler = new TaskScheduler({ successTask }, mockDb);
      await scheduler.run();

      expect(attemptCount).toBe(1);

      const runs = mockDb.getAllRuns();
      expect(runs).toHaveLength(1);

      const run = runs[0];
      expect(run).toBeDefined();
      if (run) {
        expect(run.status).toBe('COMPLETED');
        expect(run.errorMessage).toBeUndefined();
        expect(run.resultMessage).toBe('Task completed: 5 + 5 = 10');
      }
    });
  });

  describe('ignore policy', () => {
    it('should mark failed tasks as failed without retry indication', async () => {
      let attemptCount = 0;
      const failingTask: TaskDefinition = {
        schedule: { cron: '0 0 * * *' },
        timeout: 5,
        retryPolicy: 'ignore',
        handler: () => {
          attemptCount++;
          throw new Error('Task failed');
        },
      };

      const scheduler = new TaskScheduler({ failingTask }, mockDb);
      await scheduler.run();

      expect(attemptCount).toBe(1);

      const runs = mockDb.getAllRuns();
      expect(runs).toHaveLength(1);

      const run = runs[0];
      expect(run).toBeDefined();
      if (run) {
        expect(run.status).toBe('FAILED');
        expect(run.errorMessage).toBe('Task failed');
        expect(run.errorMessage).not.toContain('will retry');
        expect(run.retryOfRunId).toBeUndefined();
      }
    });

    it('should complete successfully when task succeeds', async () => {
      let attemptCount = 0;
      const successTask: TaskDefinition = {
        schedule: { cron: '0 0 * * *' },
        timeout: 5,
        retryPolicy: 'ignore',
        handler: () => {
          attemptCount++;
          const result = 5 + 5;
          return Promise.resolve(`Task completed: 5 + 5 = ${result}`);
        },
      };

      const scheduler = new TaskScheduler({ successTask }, mockDb);
      await scheduler.run();

      expect(attemptCount).toBe(1);

      const runs = mockDb.getAllRuns();
      expect(runs).toHaveLength(1);

      const run = runs[0];
      expect(run).toBeDefined();
      if (run) {
        expect(run.status).toBe('COMPLETED');
        expect(run.errorMessage).toBeUndefined();
        expect(run.resultMessage).toBe('Task completed: 5 + 5 = 10');
      }
    });
  });

  describe('mixed retry policies', () => {
    it('should handle different retry policies correctly', async () => {
      let retryTaskAttempts = 0;
      let ignoreTaskAttempts = 0;

      const retryTask: TaskDefinition = {
        schedule: { cron: '0 0 * * *' },
        timeout: 5,
        retryPolicy: 'retry-on-fail',
        handler: () => {
          retryTaskAttempts++;
          throw new Error('Retry task failed');
        },
      };

      const ignoreTask: TaskDefinition = {
        schedule: { cron: '0 0 * * *' },
        timeout: 5,
        retryPolicy: 'ignore',
        handler: () => {
          ignoreTaskAttempts++;
          throw new Error('Ignore task failed');
        },
      };

      const scheduler = new TaskScheduler({ retryTask, ignoreTask }, mockDb);
      await scheduler.run();

      expect(retryTaskAttempts).toBe(1);
      expect(ignoreTaskAttempts).toBe(1);

      const runs = mockDb.getAllRuns();
      expect(runs).toHaveLength(2);

      const retryRun = runs.find((e) => e.taskName === 'retryTask');
      const ignoreRun = runs.find((e) => e.taskName === 'ignoreTask');

      expect(retryRun).toBeDefined();
      expect(ignoreRun).toBeDefined();

      if (retryRun) {
        expect(retryRun.status).toBe('FAILED');
        expect(retryRun.errorMessage).toContain('will retry in next run');
      }

      if (ignoreRun) {
        expect(ignoreRun.status).toBe('FAILED');
        expect(ignoreRun.errorMessage).toBe('Ignore task failed');
        expect(ignoreRun.errorMessage).not.toContain('will retry');
      }
    });
  });

  describe('scheduler run behavior', () => {
    it('should not throw errors and continue with other tasks', async () => {
      const failingTask1: TaskDefinition = {
        schedule: { cron: '0 0 * * *' },
        timeout: 5,
        retryPolicy: 'retry-on-fail',
        handler: () => {
          throw new Error('Task 1 failed');
        },
      };

      const failingTask2: TaskDefinition = {
        schedule: { cron: '0 0 * * *' },
        timeout: 5,
        retryPolicy: 'ignore',
        handler: () => {
          throw new Error('Task 2 failed');
        },
      };

      const successTask: TaskDefinition = {
        schedule: { cron: '0 0 * * *' },
        timeout: 5,
        retryPolicy: 'retry-on-fail',
        handler: () => {
          const result = 5 + 5;
          return Promise.resolve(`Task completed: 5 + 5 = ${result}`);
        },
      };

      const scheduler = new TaskScheduler(
        {
          failingTask1,
          failingTask2,
          successTask,
        },
        mockDb,
      );

      await expect(scheduler.run()).resolves.not.toThrow();

      const runs = mockDb.getAllRuns();
      expect(runs).toHaveLength(3);

      const task1Run = runs.find((e) => e.taskName === 'failingTask1');
      const task2Run = runs.find((e) => e.taskName === 'failingTask2');
      const task3Run = runs.find((e) => e.taskName === 'successTask');

      expect(task1Run?.status).toBe('FAILED');
      expect(task1Run?.errorMessage).toContain('will retry in next run');

      expect(task2Run?.status).toBe('FAILED');
      expect(task2Run?.errorMessage).toBe('Task 2 failed');

      expect(task3Run?.status).toBe('COMPLETED');
      expect(task3Run?.resultMessage).toBe('Task completed: 5 + 5 = 10');
    });
  });
});
