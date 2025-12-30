import { describe, it, expect, beforeEach } from 'vitest';
import { TaskScheduler } from '../taskScheduler';
import { MockTaskSchedulerDatabase } from './mock';
import { TaskSchedulerErrorCode } from '../errors';

describe('Time Simulation Tests', () => {
  let scheduler: TaskScheduler;
  let mockDb: MockTaskSchedulerDatabase;
  let failureCount: number;
  let successCount: number;

  beforeEach(() => {
    mockDb = new MockTaskSchedulerDatabase();
    failureCount = 0;
    successCount = 0;
  });

  describe('Retry behavior over time', () => {
    it('should retry failed tasks in subsequent runs over simulated time', async () => {
      scheduler = new TaskScheduler(
        {
          flakyTask: {
            handler: () => {
              failureCount++;
              if (failureCount <= 2) {
                throw new Error(`Attempt ${failureCount} failed`);
              }
              successCount++;
              const result = 3 + 7;
              return `Flaky task succeeded: 3 + 7 = ${result}`;
            },
            timeout: 5,
            retryPolicy: 'retry-on-fail',
            schedule: {
              cron: '0 * * * *',

              enabled: true,
            },
          },
        },
        mockDb,
      );

      const startTime = new Date('2024-01-01T10:00:00Z');
      mockDb.setTime(startTime);

      await scheduler.run();
      expect(failureCount).toBe(1);
      expect(successCount).toBe(0);

      const runs = mockDb.getAllRuns();
      expect(runs).toHaveLength(1);
      expect(runs[0]?.status).toBe('FAILED');
      expect(runs[0]?.errorCode).toBe(TaskSchedulerErrorCode.RETRY_SCHEDULED);

      mockDb.advanceHours(0.5);

      await scheduler.run();
      expect(failureCount).toBe(2);
      expect(successCount).toBe(0);

      const runs2 = mockDb.getAllRuns();
      expect(runs2).toHaveLength(2);
      expect(runs2[1]?.status).toBe('FAILED');
      expect(runs2[1]?.errorCode).toBe(TaskSchedulerErrorCode.RETRY_SCHEDULED);

      mockDb.advanceHours(0.5);

      await scheduler.run();
      expect(failureCount).toBe(3);
      expect(successCount).toBe(1);

      const runs3 = mockDb.getAllRuns();
      expect(runs3).toHaveLength(3);
      expect(runs3[2]?.status).toBe('COMPLETED');
      expect(runs3[2]?.errorMessage).toBeUndefined();
      expect(runs3[2]?.resultMessage).toBe('Flaky task succeeded: 3 + 7 = 10');
    });

    it('should not retry failed tasks outside the retry window', async () => {
      scheduler = new TaskScheduler(
        {
          oldFailureTask: {
            handler: () => {
              failureCount++;
              if (failureCount === 1) {
                throw new Error('Initial failure');
              }
              successCount++;
              const result = 15 + 25;
              return `Old failure task succeeded: 15 + 25 = ${result}`;
            },
            timeout: 5,
            retryPolicy: 'retry-on-fail',
            schedule: {
              cron: '0 * * * *',

              enabled: true,
            },
          },
        },
        mockDb,
      );

      const startTime = new Date('2024-01-01T10:00:00Z');
      mockDb.setTime(startTime);

      await scheduler.run();
      expect(failureCount).toBe(1);
      expect(successCount).toBe(0);

      mockDb.advanceHours(2);

      await scheduler.run();
      expect(failureCount).toBe(2); // Task runs again as regular schedule after 2 hours (it's hourly)
      expect(successCount).toBe(1); // Second attempt succeeds

      const runs = mockDb.getAllRuns();
      expect(runs).toHaveLength(2); // Two runs: first failed, second succeeded
    });

    it('should handle multiple failed tasks with different retry windows', async () => {
      let task1Failures = 0;
      let task2Failures = 0;

      scheduler = new TaskScheduler(
        {
          task1: {
            handler: () => {
              task1Failures++;
              if (task1Failures <= 1) {
                throw new Error('Task 1 failure');
              }
              const result = 1 + 1;
              return `Task completed: 1 + 1 = ${result}`;
            },
            timeout: 5,
            retryPolicy: 'retry-on-fail',
            schedule: {
              cron: '0 * * * *',

              enabled: true,
            },
          },
          task2: {
            handler: () => {
              task2Failures++;
              if (task2Failures <= 2) {
                throw new Error('Task 2 failure');
              }
              const result = 1 + 1;
              return `Task completed: 1 + 1 = ${result}`;
            },
            timeout: 5,
            retryPolicy: 'retry-on-fail',
            schedule: {
              cron: '0 * * * *',

              enabled: true,
            },
          },
        },
        mockDb,
      );

      const startTime = new Date('2024-01-01T10:00:00Z');
      mockDb.setTime(startTime);

      await scheduler.run();
      expect(task1Failures).toBe(1);
      expect(task2Failures).toBe(1);

      let runs = mockDb.getAllRuns();
      expect(runs).toHaveLength(2);
      expect(runs.filter((e) => e.status === 'FAILED')).toHaveLength(2);

      mockDb.advanceHours(0.5);

      await scheduler.run();
      expect(task1Failures).toBe(2);
      expect(task2Failures).toBe(2);

      runs = mockDb.getAllRuns();
      expect(runs).toHaveLength(4);
      expect(runs.filter((e) => e.status === 'COMPLETED')).toHaveLength(1);
      expect(runs.filter((e) => e.status === 'FAILED')).toHaveLength(3);

      mockDb.advanceHours(0.5);

      await scheduler.run();
      expect(task1Failures).toBe(2);
      expect(task2Failures).toBe(3);

      runs = mockDb.getAllRuns();
      expect(runs).toHaveLength(5);
      expect(runs.filter((e) => e.status === 'COMPLETED')).toHaveLength(2);
      expect(runs.filter((e) => e.status === 'FAILED')).toHaveLength(3);
    });
  });

  describe('Time-based run patterns', () => {
    it('should execute tasks normally when no retries are needed', async () => {
      scheduler = new TaskScheduler(
        {
          reliableTtask: {
            handler: () => {
              successCount++;
              const result = 1 + 1;
              return `Task completed: 1 + 1 = ${result}`;
            },
            timeout: 5,
            retryPolicy: 'retry-on-fail',
            schedule: {
              cron: '0 * * * *',

              enabled: true,
            },
          },
        },
        mockDb,
      );

      for (let i = 0; i < 5; i++) {
        if (i > 0) {
          mockDb.advanceHours(0.5);
        }
        await scheduler.run();
      }

      expect(successCount).toBe(3); // Only runs at t=0, t=60min, t=120min (hourly task with 30min intervals)

      const runs = mockDb.getAllRuns();
      expect(runs).toHaveLength(3);
      expect(runs.filter((e) => e.status === 'COMPLETED')).toHaveLength(3);
    });

    it('should handle mixed success and failure patterns over time', async () => {
      let runCount = 0;

      scheduler = new TaskScheduler(
        {
          intermittentTask: {
            handler: () => {
              runCount++;

              if (runCount === 2 || runCount === 4) {
                throw new Error(`Failure on run ${runCount}`);
              }
              successCount++;
              const result = 1 + 1;
              return `Task completed: 1 + 1 = ${result}`;
            },
            timeout: 5,
            retryPolicy: 'retry-on-fail',
            schedule: {
              cron: '0 * * * *',

              enabled: true,
            },
          },
        },
        mockDb,
      );

      const startTime = new Date('2024-01-01T10:00:00Z');

      mockDb.setTime(startTime);
      await scheduler.run();
      expect(runCount).toBe(1);
      expect(successCount).toBe(1);

      mockDb.advanceHours(1);
      await scheduler.run();
      expect(runCount).toBe(2);
      expect(successCount).toBe(1);

      mockDb.advanceHours(1);
      await scheduler.run();
      expect(runCount).toBe(3);
      expect(successCount).toBe(2);

      mockDb.advanceHours(1);
      await scheduler.run();
      expect(runCount).toBe(4);
      expect(successCount).toBe(2);

      // No time advancement needed - same time as previous
      await scheduler.run();
      expect(runCount).toBe(5);
      expect(successCount).toBe(3);

      const runs = mockDb.getAllRuns();
      expect(runs).toHaveLength(5);
      expect(runs.filter((e) => e.status === 'COMPLETED')).toHaveLength(3);
      expect(runs.filter((e) => e.status === 'FAILED')).toHaveLength(2);
    });

    it('should properly calculate run durations across time simulation', async () => {
      scheduler = new TaskScheduler(
        {
          durationTestTask: {
            handler: () => {
              const currentTime = mockDb.getCurrentTime();
              const taskDuration = new Date(currentTime.getTime() + 5000);
              mockDb.setTime(taskDuration);

              const result = 100 + 50;
              return `Duration test task completed: 100 + 50 = ${result}`;
            },
            timeout: 5,
            retryPolicy: 'ignore',
            schedule: {
              cron: '0 * * * *',

              enabled: true,
            },
          },
        },
        mockDb,
      );

      const startTime = new Date('2024-01-01T10:00:00Z');
      mockDb.setTime(startTime);

      await scheduler.run();

      const runs = mockDb.getAllRuns();
      expect(runs).toHaveLength(1);
      expect(runs[0]?.status).toBe('COMPLETED');
      expect(runs[0]?.durationMs).toBe(5000);
      expect(runs[0]?.completedAt?.getTime()).toBe(startTime.getTime() + 5000);
      expect(runs[0]?.resultMessage).toBe('Duration test task completed: 100 + 50 = 150');
    });
  });

  describe('Edge cases in time simulation', () => {
    it('should handle tasks that fail consistently and never succeed', async () => {
      scheduler = new TaskScheduler(
        {
          alwaysFailingTask: {
            handler: () => {
              failureCount++;
              throw new Error(`Failure ${failureCount}`);
            },
            timeout: 5,
            retryPolicy: 'retry-on-fail',
            schedule: {
              cron: '0 * * * *',

              enabled: true,
            },
          },
        },
        mockDb,
      );

      for (let i = 0; i < 5; i++) {
        if (i > 0) {
          mockDb.advanceHours(0.25);
        }
        await scheduler.run();
      }

      expect(failureCount).toBe(5);

      const runs = mockDb.getAllRuns();
      expect(runs).toHaveLength(5);
      expect(runs.filter((e) => e.status === 'FAILED')).toHaveLength(5);

      runs.forEach((run) => {
        expect(run.errorCode).toBe(TaskSchedulerErrorCode.RETRY_SCHEDULED);
      });
    });

    it('should not create duplicate retries when multiple runs happen quickly', async () => {
      let attemptCount = 0;

      scheduler = new TaskScheduler(
        {
          quickRetryTask: {
            handler: () => {
              attemptCount++;
              if (attemptCount === 1) {
                throw new Error('First failure');
              }
              successCount++;
              const result = 1 + 1;
              return `Task completed: 1 + 1 = ${result}`;
            },
            timeout: 5,
            retryPolicy: 'retry-on-fail',
            schedule: {
              cron: '0 * * * *',

              enabled: true,
            },
          },
        },
        mockDb,
      );

      const startTime = new Date('2024-01-01T10:00:00Z');
      mockDb.setTime(startTime);

      await scheduler.run();
      expect(attemptCount).toBe(1);

      for (let i = 1; i <= 3; i++) {
        mockDb.advanceHours(5 / 60); // 5 minutes
        await scheduler.run();
      }

      expect(attemptCount).toBe(2);
      expect(successCount).toBe(1);

      const runs = mockDb.getAllRuns();
      expect(runs).toHaveLength(2);
      expect(runs[0]?.status).toBe('FAILED');
      expect(runs[1]?.status).toBe('COMPLETED');
      expect(runs[1]?.resultMessage).toBe('Task completed: 1 + 1 = 2');
    });

    it('should stop retrying failed tasks once next scheduled time is reached', async () => {
      let attemptCount = 0;

      scheduler = new TaskScheduler(
        {
          scheduledTask: {
            handler: () => {
              attemptCount++;

              // Fail on first attempt, succeed on second
              if (attemptCount === 1) {
                throw new Error('First attempt failed');
              }

              const result = 10 + 20;
              return `Task succeeded: 10 + 20 = ${result}`;
            },
            timeout: 5,
            retryPolicy: 'retry-on-fail',
            schedule: {
              cron: '0 * * * *', // Hourly at the top of the hour
              enabled: true,
            },
          },
        },
        mockDb,
      );

      // Start at 10:00
      const startTime = new Date('2024-01-01T10:00:00Z');
      mockDb.setTime(startTime);

      // First run - task fails
      await scheduler.run();
      expect(attemptCount).toBe(1);
      expect(mockDb.getAllRuns()).toHaveLength(1);
      expect(mockDb.getAllRuns()[0]?.status).toBe('FAILED');

      // Advance time to 10:30 (within retry window, before next scheduled time)
      mockDb.setTime(new Date('2024-01-01T10:30:00Z'));

      // Run scheduler - should retry the failed task
      await scheduler.run();
      expect(attemptCount).toBe(2); // Task retried and succeeded
      expect(mockDb.getAllRuns()).toHaveLength(2);
      expect(mockDb.getAllRuns()[1]?.status).toBe('COMPLETED');

      // Reset for next test phase - create new scheduler with fresh mock
      attemptCount = 0;
      mockDb = new MockTaskSchedulerDatabase();
      scheduler = new TaskScheduler(
        {
          scheduledTask: {
            handler: () => {
              attemptCount++;

              // This time succeed on the second attempt (which should be the new scheduled run)
              if (attemptCount === 1) {
                throw new Error('First attempt failed');
              }

              const result = 10 + 20;
              return `Task succeeded: 10 + 20 = ${result}`;
            },
            timeout: 5,
            retryPolicy: 'retry-on-fail',
            schedule: {
              cron: '0 * * * *', // Hourly at the top of the hour
              enabled: true,
            },
          },
        },
        mockDb,
      );

      // Now test what happens when we advance past the next scheduled time
      // Start fresh at 11:00 (next scheduled time)
      mockDb.setTime(new Date('2024-01-01T11:00:00Z'));

      // Task fails at 11:00
      await scheduler.run();
      expect(attemptCount).toBe(1);
      expect(mockDb.getAllRuns()).toHaveLength(1);
      expect(mockDb.getAllRuns()[0]?.status).toBe('FAILED');

      // Jump past the next scheduled time (advance to 12:30, skipping the 12:00 scheduled time)
      mockDb.setTime(new Date('2024-01-01T12:30:00Z'));

      // Run scheduler - should NOT retry the old failure, but should run as new scheduled execution
      await scheduler.run();
      expect(attemptCount).toBe(2); // New execution (not a retry of the 11:00 failure)

      const allRuns = mockDb.getAllRuns();
      expect(allRuns).toHaveLength(2);
      expect(allRuns[0]?.status).toBe('FAILED'); // 11:00 failure
      expect(allRuns[1]?.status).toBe('COMPLETED'); // 12:30 new execution (succeeded)
      expect(allRuns[1]?.resultMessage).toBe('Task succeeded: 10 + 20 = 30');
    });
  });
});
