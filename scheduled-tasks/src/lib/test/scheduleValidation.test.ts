import { describe, it, expect, beforeEach } from 'vitest';
import { TaskScheduler } from '../taskScheduler.js';
import { MockTaskSchedulerDatabase } from './mock.js';
import type { TaskDefinition } from '../index.js';

describe('Schedule Validation', () => {
  let mockDb: MockTaskSchedulerDatabase;

  beforeEach(() => {
    mockDb = new MockTaskSchedulerDatabase();
  });

  describe('Task Eligibility', () => {
    it('should execute all enabled tasks when none are running', async () => {
      const tasks: Record<string, TaskDefinition> = {
        hourlyTask: {
          schedule: {
            cron: '0 * * * *',
          },
          timeout: 2,
          retryPolicy: 'retry-on-fail',
          handler: (span) => {
            span.log('Test task executed', { stdout: false });
            const result = 2 + 3;
            return Promise.resolve(`Hourly task completed: 2 + 3 = ${result}`);
          },
        },
        dailyTask: {
          schedule: {
            cron: '0 0 * * *',
          },
          timeout: 5,
          retryPolicy: 'retry-on-fail',
          handler: (span) => {
            span.log('Test task executed', { stdout: false });
            const result = 5 + 7;
            return Promise.resolve(`Daily task completed: 5 + 7 = ${result}`);
          },
        },
        customIntervalTask: {
          schedule: {
            cron: '*/30 * * * *',
          },
          timeout: 3,
          retryPolicy: 'ignore',
          handler: (span) => {
            span.log('Test task executed', { stdout: false });
            const result = 10 + 15;
            return Promise.resolve(`Custom interval task completed: 10 + 15 = ${result}`);
          },
        },
        weeklyTask: {
          schedule: {
            cron: '0 0 * * 0',
          },
          timeout: 9,
          retryPolicy: 'retry-on-fail',
          handler: (span) => {
            span.log('Test task executed', { stdout: false });
            const result = 20 + 25;
            return Promise.resolve(`Weekly task completed: 20 + 25 = ${result}`);
          },
        },
        disabledTask: {
          schedule: {
            cron: '0 0 * * *',
            enabled: false,
          },
          timeout: 1,
          retryPolicy: 'ignore',
          handler: (span) => {
            span.log('Test task executed', { stdout: false });
            const result = 5 + 5;
            return Promise.resolve(`Task completed: 5 + 5 = ${result}`);
          },
        },
      };
      const scheduler = new TaskScheduler(tasks, mockDb);

      await scheduler.run();

      const allRuns = mockDb.getAllRuns();
      const taskNames = allRuns.map((e) => e.taskName);

      expect(allRuns).toHaveLength(4);
      expect(taskNames).toContain('hourlyTask');
      expect(taskNames).toContain('dailyTask');
      expect(taskNames).toContain('customIntervalTask');
      expect(taskNames).toContain('weeklyTask');
      expect(taskNames).not.toContain('disabledTask');
    });

    it('should skip disabled tasks', async () => {
      const tasks: Record<string, TaskDefinition> = {
        enabledTask: {
          schedule: { cron: '0 0 * * *' },
          timeout: 5,
          retryPolicy: 'retry-on-fail',
          handler: (span) => {
            span.log('Test task executed', { stdout: false });
            const result = 5 + 5;
            return Promise.resolve(`Task completed: 5 + 5 = ${result}`);
          },
        },
        disabledTask: {
          schedule: {
            cron: '0 0 * * *',
            enabled: false,
          },
          timeout: 5,
          retryPolicy: 'retry-on-fail',
          handler: (span) => {
            span.log('Test task executed', { stdout: false });
            const result = 5 + 5;
            return Promise.resolve(`Task completed: 5 + 5 = ${result}`);
          },
        },
      };
      const scheduler = new TaskScheduler(tasks, mockDb);

      await scheduler.run();

      const allRuns = mockDb.getAllRuns();
      const taskNames = allRuns.map((e) => e.taskName);

      expect(taskNames).toContain('enabledTask');
      expect(taskNames).not.toContain('disabledTask');
    });

    it('should skip tasks that are already running', async () => {
      const tasks: Record<string, TaskDefinition> = {
        runningTask: {
          schedule: { cron: '0 0 * * *' },
          timeout: 5,
          retryPolicy: 'retry-on-fail',
          handler: (span) => {
            span.log('Test task executed', { stdout: false });
            const result = 5 + 5;
            return Promise.resolve(`Task completed: 5 + 5 = ${result}`);
          },
        },
        availableTask: {
          schedule: { cron: '0 0 * * *' },
          timeout: 5,
          retryPolicy: 'retry-on-fail',
          handler: (span) => {
            span.log('Test task executed', { stdout: false });
            const result = 5 + 5;
            return Promise.resolve(`Task completed: 5 + 5 = ${result}`);
          },
        },
      };

      await mockDb.createTaskRun({
        taskName: 'runningTask',
        status: 'RUNNING',
        startedAt: new Date(),
        advisoryLockId: BigInt(123),
      });

      const scheduler = new TaskScheduler(tasks, mockDb);
      await scheduler.run();

      const allRuns = mockDb.getAllRuns();
      const newRuns = allRuns.filter((e) => e.taskName === 'availableTask');
      const runningRuns = allRuns.filter((e) => e.taskName === 'runningTask');

      expect(newRuns).toHaveLength(1);
      expect(runningRuns).toHaveLength(1);
    });
  });

  describe('Task Discovery', () => {
    it('should discover all eligible tasks in a single run', async () => {
      const tasks: Record<string, TaskDefinition> = {
        task1: {
          schedule: { cron: '0 0 * * *', enabled: true },
          timeout: 5,
          retryPolicy: 'ignore',
          handler: async () => Promise.resolve('Task completed: 1 + 1 = 2'),
        },
        task2: {
          schedule: { cron: '0 1 * * *', enabled: true },
          timeout: 5,
          retryPolicy: 'ignore',
          handler: async () => Promise.resolve('Task completed: 1 + 1 = 2'),
        },
        task3: {
          schedule: { cron: '0 2 * * *', enabled: true },
          timeout: 5,
          retryPolicy: 'ignore',
          handler: async () => Promise.resolve('Task completed: 1 + 1 = 2'),
        },
        task4: {
          schedule: { cron: '0 3 * * *', enabled: true },
          timeout: 5,
          retryPolicy: 'ignore',
          handler: async () => Promise.resolve('Task completed: 1 + 1 = 2'),
        },
      };
      const scheduler = new TaskScheduler(tasks, mockDb);

      await scheduler.run();

      const allRuns = mockDb.getAllRuns();
      expect(allRuns).toHaveLength(4);

      const completedTasks = allRuns.filter((e) => e.status === 'COMPLETED');
      expect(completedTasks).toHaveLength(4);
    });

    it('should handle empty task list gracefully', async () => {
      const scheduler = new TaskScheduler({}, mockDb);

      await scheduler.run();

      const allRuns = mockDb.getAllRuns();
      expect(allRuns).toHaveLength(0);
    });
  });

  describe('Concurrent Run Prevention', () => {
    it('should not execute the same task twice when called concurrently', async () => {
      const tasks: Record<string, TaskDefinition> = {
        concurrentTestTask: {
          schedule: { cron: '0 0 * * *' },
          timeout: 5,
          retryPolicy: 'ignore',
          handler: async () => Promise.resolve('Task completed: 1 + 1 = 2'),
        },
      };

      const scheduler1 = new TaskScheduler(tasks, mockDb);
      const scheduler2 = new TaskScheduler(tasks, mockDb);

      await Promise.all([scheduler1.run(), scheduler2.run()]);

      const runs = mockDb.getRunsForTask('concurrentTestTask');
      expect(runs).toHaveLength(1);
    });
  });
});
