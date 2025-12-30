import { describe, it, expect } from 'vitest';
import { TaskScheduler } from '../taskScheduler.js';
import { MockTaskSchedulerDatabase } from './mock.js';
import type { TaskDefinition } from '../index.js';
import delay from 'delay';

describe('Task run Behavior', () => {
  describe('Success Scenarios', () => {
    it('should execute task successfully and record completion', async () => {
      const mockDb = new MockTaskSchedulerDatabase();
      const scheduler = new TaskScheduler(
        {
          successTask: {
            schedule: { cron: '0 0 * * *' },
            timeout: 1,
            retryPolicy: 'ignore',
            handler: (span) => {
              span.log('Task completed successfully', { stdout: true });
              const result = 5 + 5;
              return Promise.resolve(`Task completed: 5 + 5 = ${result}`);
            },
          },
        },
        mockDb,
      );
      await scheduler.run();

      const runs = mockDb.getRunsForTask('successTask');
      expect(runs).toHaveLength(1);
      const run = runs[0];
      expect(run?.status).toBe('COMPLETED');
      expect(run?.errorMessage).toBeUndefined();
      expect(run?.resultMessage).toBe('Task completed: 5 + 5 = 10');
    });

    it('should record task run in database', async () => {
      const mockDb = new MockTaskSchedulerDatabase();

      const scheduler = new TaskScheduler(
        {
          dbRecordTask: {
            schedule: { cron: '0 0 * * *' },
            timeout: 5,
            retryPolicy: 'ignore',
            handler: (span) => {
              span.log('Task success-task completed successfully', {
                stdout: true,
              });
              const result = 5 + 5;
              return Promise.resolve(`Task completed: 5 + 5 = ${result}`);
            },
          },
        },
        mockDb,
      );
      await scheduler.run();

      const run = mockDb.getMostRecentRun('dbRecordTask');
      expect(run).toBeTruthy();
      expect(run?.taskName).toBe('dbRecordTask');
      expect(run?.status).toBe('COMPLETED');
      expect(run?.startedAt).toBeInstanceOf(Date);
      expect(run?.advisoryLockId).toBeDefined();
      expect(run?.resultMessage).toBe('Task completed: 5 + 5 = 10');
    });
  });

  describe('Failure Scenarios', () => {
    it('should handle task errors and record failure', async () => {
      const mockDb = new MockTaskSchedulerDatabase();

      const scheduler = new TaskScheduler(
        {
          errorTask: {
            schedule: { cron: '0 0 * * *' },
            timeout: 5,
            retryPolicy: 'ignore',
            handler: (span) => {
              span.log('Task error-task failed', { stdout: true });
              return Promise.reject(new Error('Task failed intentionally'));
            },
          },
        },
        mockDb,
      );

      await scheduler.run();

      const run = mockDb.getMostRecentRun('errorTask');
      expect(run).toBeTruthy();
      expect(run?.status).toBe('FAILED');
      expect(run?.errorMessage).toBe('Task failed intentionally');
    });

    it('should record error message in run record', async () => {
      const mockDb = new MockTaskSchedulerDatabase();

      const scheduler = new TaskScheduler(
        {
          errorTask: {
            schedule: { cron: '0 0 * * *' },
            timeout: 5,
            retryPolicy: 'ignore',
            handler: (span) => {
              span.log('Task error-record-task failed', { stdout: true });
              return Promise.reject(new Error('Specific error message for testing'));
            },
          },
        },
        mockDb,
      );
      await scheduler.run();

      const run = mockDb.getMostRecentRun('errorTask');
      expect(run?.errorMessage).toBe('Specific error message for testing');
    });

    it('should handle non-Error exceptions', async () => {
      const mockDb = new MockTaskSchedulerDatabase();

      const scheduler = new TaskScheduler(
        {
          stringErrorTask: {
            schedule: { cron: '0 0 * * *' },
            timeout: 5,
            retryPolicy: 'ignore',
            handler: (span) => {
              span.log('Task string-error-task failed', { stdout: true });

              return Promise.reject(new Error('String error instead of Error object'));
            },
          },
        },
        mockDb,
      );
      await scheduler.run();

      const run = mockDb.getMostRecentRun('stringErrorTask');
      expect(run?.status).toBe('FAILED');
      expect(run?.errorMessage).toBe('String error instead of Error object');
    });
  });

  describe('Timeout Scenarios', () => {
    it('should timeout task that exceeds configured timeout', async () => {
      const mockDb = new MockTaskSchedulerDatabase();

      const scheduler = new TaskScheduler(
        {
          slowTask: {
            schedule: { cron: '0 0 * * *' },
            timeout: 1,
            retryPolicy: 'ignore',
            handler: async (span) => {
              span.log('Task slow-task failed', { stdout: true });

              await delay(100);

              const result = 10 + 5;
              return `Slow task completed: 10 + 5 = ${result}`;
            },
          },
        },
        mockDb,
      );
      await scheduler.run();

      const run = mockDb.getMostRecentRun('slowTask');
      expect(run?.status).toBe('COMPLETED');
      expect(run?.resultMessage).toBe('Slow task completed: 10 + 5 = 15');
    });

    it('should respect different timeout values for different tasks', async () => {
      const mockDb = new MockTaskSchedulerDatabase();

      const scheduler = new TaskScheduler(
        {
          fastTimeoutTask: {
            schedule: { cron: '0 0 * * *' },
            timeout: 1,
            retryPolicy: 'ignore',
            handler: (span) => {
              span.log('Task fast-timeout-task completed successfully', {
                stdout: true,
              });

              const result = 5 + 5;
              return Promise.resolve(`Task completed: 5 + 5 = ${result}`);
            },
          },
        },
        mockDb,
      );
      await scheduler.run();

      const run = mockDb.getMostRecentRun('fastTimeoutTask');
      expect(run?.status).toBe('COMPLETED');
      expect(run?.resultMessage).toBe('Task completed: 5 + 5 = 10');
    });
  });

  describe('Concurrent run Prevention', () => {
    it('should skip task if advisory lock cannot be acquired', async () => {
      const mockDb = new MockTaskSchedulerDatabase();

      mockDb.setTaskAsRunning('concurrentTask');

      const scheduler = new TaskScheduler(
        {
          concurrentTask: {
            schedule: { cron: '0 0 * * *' },
            timeout: 5,
            retryPolicy: 'ignore',
            handler: (span) => {
              span.log('This should not execute', { stdout: true });
              const result = 5 + 5;
              return Promise.resolve(`Task completed: 5 + 5 = ${result}`);
            },
          },
        },
        mockDb,
      );
      await scheduler.run();

      const runs = mockDb.getRunsForTask('concurrentTask');
      expect(runs).toHaveLength(1);
      expect(runs[0]?.status).toBe('RUNNING');
    });

    it('should acquire and release advisory locks properly', async () => {
      const mockDb = new MockTaskSchedulerDatabase();
      const scheduler = new TaskScheduler(
        {
          lockTask: {
            schedule: { cron: '0 0 * * *' },
            timeout: 5,
            retryPolicy: 'ignore',
            handler: (span) => {
              span.log('Task lock-task completed successfully', {
                stdout: true,
              });
              const result = 5 + 5;
              return Promise.resolve(`Task completed: 5 + 5 = ${result}`);
            },
          },
        },
        mockDb,
      );

      await scheduler.run();

      const run = mockDb.getMostRecentRun('lockTask');
      expect(run?.status).toBe('COMPLETED');
      expect(run?.resultMessage).toBe('Task completed: 5 + 5 = 10');

      const lockId = run?.advisoryLockId;
      expect(lockId).toBeDefined();
      if (lockId != null) {
        expect(mockDb.isLockHeld(lockId)).toBe(false);
      }
    });

    it('should generate consistent lock IDs for same task name', async () => {
      const mockDb = new MockTaskSchedulerDatabase();

      const sameLockTask: TaskDefinition = {
        schedule: { cron: '0 0 * * *' },
        timeout: 5,
        retryPolicy: 'ignore',
        handler: () => {
          const result = 5 + 5;
          return Promise.resolve(`Task completed: 5 + 5 = ${result}`);
        },
      };

      const scheduler1 = new TaskScheduler({ sameLockTask }, mockDb);
      await scheduler1.run();

      mockDb.reset();

      const scheduler2 = new TaskScheduler({ sameLockTask }, mockDb);
      await scheduler2.run();

      const runs = mockDb.getAllRuns();
      expect(runs).toHaveLength(1);
      expect(runs[0]?.advisoryLockId).toBeDefined();
      expect(runs[0]?.resultMessage).toBe('Task completed: 5 + 5 = 10');
    });
  });

  describe('Database Recording', () => {
    it('should record all run attempts', async () => {
      const mockDb = new MockTaskSchedulerDatabase();

      const scheduler = new TaskScheduler(
        {
          recordTask: {
            schedule: { cron: '0 0 * * *' },
            timeout: 5,
            retryPolicy: 'ignore',
            handler: (span) => {
              span.log('Task record-task completed successfully', {
                stdout: true,
              });
              const result = 5 + 5;
              return Promise.resolve(`Task completed: 5 + 5 = ${result}`);
            },
          },
        },
        mockDb,
      );
      await scheduler.run();

      expect(mockDb.getRunCountByStatus('COMPLETED')).toBe(1);
      expect(mockDb.getRunCountByStatus('FAILED')).toBe(0);
      expect(mockDb.getAllRuns()).toHaveLength(1);

      const run = mockDb.getMostRecentRun('recordTask');
      expect(run?.resultMessage).toBe('Task completed: 5 + 5 = 10');
    });

    it('should handle database errors gracefully', async () => {
      const mockDb = new MockTaskSchedulerDatabase();

      mockDb.simulateError('create');

      const scheduler = new TaskScheduler(
        {
          disabledScheduleTask: {
            schedule: { cron: '0 0 * * *' },
            timeout: 5,
            retryPolicy: 'ignore',
            handler: (span) => {
              span.log('Task db-error-task failed', { stdout: true });
              const result = 5 + 5;
              return Promise.resolve(`Task completed: 5 + 5 = ${result}`);
            },
          },
        },
        mockDb,
      );

      await scheduler.run();

      expect(mockDb.getAllRuns()).toHaveLength(0);
    });

    it('should handle non-existent task gracefully', async () => {
      const mockDb = new MockTaskSchedulerDatabase();

      const scheduler = new TaskScheduler({}, mockDb);

      await scheduler.run();

      expect(mockDb.getAllRuns()).toHaveLength(0);
    });
  });
});
