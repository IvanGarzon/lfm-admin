import { describe, it, expect, beforeEach } from 'vitest';
import { TaskScheduler } from '../taskScheduler.js';
import { MockTaskSchedulerDatabase } from './mock.js';
import type { TaskDefinition } from '../index.js';

describe('Cron Scheduling Logic', () => {
  let mockDb: MockTaskSchedulerDatabase;

  beforeEach(() => {
    mockDb = new MockTaskSchedulerDatabase();
  });

  describe('Every 15 minutes task', () => {
    it('runs task when 15 minutes have passed', async () => {
      const task: TaskDefinition = {
        schedule: {
          cron: '*/15 * * * *',
          timezone: 'UTC',
        },
        timeout: 2,
        retryPolicy: 'ignore',
        handler: () => Promise.resolve('Task completed'),
      };

      const scheduler = new TaskScheduler({ fifteenMinTask: task }, mockDb);

      mockDb.setTime(new Date('2024-01-01T10:00:00Z'));
      await scheduler.run();

      const runs = mockDb.getAllRuns();
      expect(runs).toHaveLength(1);
      expect(runs[0]?.status).toBe('COMPLETED');

      mockDb.setTime(new Date('2024-01-01T10:10:00Z'));
      await scheduler.run();

      expect(mockDb.getAllRuns()).toHaveLength(1);

      mockDb.setTime(new Date('2024-01-01T10:15:00Z'));
      await scheduler.run();

      expect(mockDb.getAllRuns()).toHaveLength(2);
    });
  });

  describe('Hourly task', () => {
    it('runs task at the correct hour boundary', async () => {
      const task: TaskDefinition = {
        schedule: {
          cron: '0 * * * *',
          timezone: 'UTC',
        },
        timeout: 2,
        retryPolicy: 'ignore',
        handler: () => Promise.resolve('Task completed'),
      };

      const scheduler = new TaskScheduler({ hourlyTask: task }, mockDb);

      mockDb.setTime(new Date('2024-01-01T10:00:00Z'));
      await scheduler.run();

      expect(mockDb.getAllRuns()).toHaveLength(1);

      mockDb.setTime(new Date('2024-01-01T10:30:00Z'));
      await scheduler.run();

      expect(mockDb.getAllRuns()).toHaveLength(1);

      mockDb.setTime(new Date('2024-01-01T11:00:00Z'));
      await scheduler.run();

      expect(mockDb.getAllRuns()).toHaveLength(2);
    });
  });

  describe('Daily task', () => {
    it('runs task once per day at specified time', async () => {
      const task: TaskDefinition = {
        schedule: {
          cron: '0 4 * * *',
          timezone: 'Australia/Sydney',
        },
        timeout: 2,
        retryPolicy: 'ignore',
        handler: () => Promise.resolve('Task completed'),
      };

      const scheduler = new TaskScheduler({ dailyTask: task }, mockDb);

      mockDb.setTime(new Date('2024-01-01T04:00:00+11:00'));
      await scheduler.run();

      expect(mockDb.getAllRuns()).toHaveLength(1);

      mockDb.setTime(new Date('2024-01-01T12:00:00+11:00'));
      await scheduler.run();

      expect(mockDb.getAllRuns()).toHaveLength(1);

      mockDb.setTime(new Date('2024-01-02T04:00:00+11:00'));
      await scheduler.run();

      expect(mockDb.getAllRuns()).toHaveLength(2);
    });
  });

  describe('Task with no timezone (defaults to UTC)', () => {
    it('uses UTC as default timezone', async () => {
      const task: TaskDefinition = {
        schedule: {
          cron: '0 * * * *',
        },
        timeout: 2,
        retryPolicy: 'ignore',
        handler: () => Promise.resolve('Task completed'),
      };

      const scheduler = new TaskScheduler({ utcTask: task }, mockDb);

      mockDb.setTime(new Date('2024-01-01T10:00:00Z'));
      await scheduler.run();

      expect(mockDb.getAllRuns()).toHaveLength(1);

      mockDb.setTime(new Date('2024-01-01T11:00:00Z'));
      await scheduler.run();

      expect(mockDb.getAllRuns()).toHaveLength(2);
    });
  });

  describe('Multiple tasks with different schedules', () => {
    it('runs each task according to its own schedule', async () => {
      const tasks: Record<string, TaskDefinition> = {
        everyFifteen: {
          schedule: { cron: '*/15 * * * *', timezone: 'UTC' },
          timeout: 2,
          retryPolicy: 'ignore',
          handler: () => Promise.resolve('Fifteen minute task'),
        },
        hourly: {
          schedule: { cron: '0 * * * *', timezone: 'UTC' },
          timeout: 2,
          retryPolicy: 'ignore',
          handler: () => Promise.resolve('Hourly task'),
        },
        daily: {
          schedule: { cron: '0 0 * * *', timezone: 'UTC' },
          timeout: 2,
          retryPolicy: 'ignore',
          handler: () => Promise.resolve('Daily task'),
        },
      };

      const scheduler = new TaskScheduler(tasks, mockDb);

      mockDb.setTime(new Date('2024-01-01T00:00:00Z'));
      await scheduler.run();

      expect(mockDb.getAllRuns()).toHaveLength(3);

      mockDb.setTime(new Date('2024-01-01T00:15:00Z'));
      await scheduler.run();

      const runs = mockDb.getAllRuns();
      expect(runs).toHaveLength(4);
      expect(runs.filter((r) => r.taskName === 'everyFifteen')).toHaveLength(2);
      expect(runs.filter((r) => r.taskName === 'hourly')).toHaveLength(1);
      expect(runs.filter((r) => r.taskName === 'daily')).toHaveLength(1);

      mockDb.setTime(new Date('2024-01-01T01:00:00Z'));
      await scheduler.run();

      const runs2 = mockDb.getAllRuns();
      expect(runs2).toHaveLength(6);
      expect(runs2.filter((r) => r.taskName === 'everyFifteen')).toHaveLength(3);
      expect(runs2.filter((r) => r.taskName === 'hourly')).toHaveLength(2);
      expect(runs2.filter((r) => r.taskName === 'daily')).toHaveLength(1);
    });
  });

  describe('Task that missed its scheduled time', () => {
    it('runs when scheduler catches up', async () => {
      const task: TaskDefinition = {
        schedule: {
          cron: '0 * * * *',
          timezone: 'UTC',
        },
        timeout: 2,
        retryPolicy: 'ignore',
        handler: () => Promise.resolve('Task completed'),
      };

      const scheduler = new TaskScheduler({ hourlyTask: task }, mockDb);

      mockDb.setTime(new Date('2024-01-01T10:00:00Z'));
      await scheduler.run();

      expect(mockDb.getAllRuns()).toHaveLength(1);

      mockDb.setTime(new Date('2024-01-01T12:05:00Z'));
      await scheduler.run();

      expect(mockDb.getAllRuns()).toHaveLength(2);

      const lastRun = mockDb.getAllRuns()[1];
      expect(lastRun?.status).toBe('COMPLETED');
    });
  });

  describe('Invalid cron expression', () => {
    it('throws error at construction time', () => {
      const task: TaskDefinition = {
        schedule: {
          cron: 'invalid cron',
          timezone: 'UTC',
        },
        timeout: 2,
        retryPolicy: 'ignore',
        handler: () => Promise.resolve('Task completed'),
      };

      expect(() => {
        new TaskScheduler({ invalidTask: task }, mockDb);
      }).toThrow('Invalid cron expression for task "invalidTask": invalid cron');
    });
  });
});
