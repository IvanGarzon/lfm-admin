/**
 * Task Registry Service
 *
 * Syncs task definitions from code to the database.
 * Uses the centralized task registry for clean, type-safe task management.
 */

import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { ScheduledTaskRepository } from '@/repositories/scheduled-task-repository';
import { ScheduleType } from '@/prisma/client';
import type { TaskDefinition } from '@/lib/tasks/types';

const taskRepo = new ScheduledTaskRepository(prisma);

/**
 * Sync all registered tasks to the database
 *
 * @param tasks - Record of task definitions
 * @returns Promise with sync results
 */
export async function syncTasksToDatabase(tasks: Record<string, TaskDefinition>): Promise<{
  synced: number;
  created: number;
  updated: number;
}> {
  try {
    const taskArray = Object.values(tasks);

    logger.info('Starting task registry sync', {
      context: 'task-registry',
      metadata: { taskCount: taskArray.length },
    });

    let created = 0;
    let updated = 0;

    for (const task of taskArray) {
      const existing = await taskRepo.findByFunctionId(task.id);

      // Determine schedule type
      let scheduleType: ScheduleType = 'EVENT';
      if (task.schedule.cron && task.schedule.event) {
        scheduleType = 'HYBRID';
      } else if (task.schedule.cron) {
        scheduleType = 'CRON';
      }

      await taskRepo.upsert({
        functionId: task.id,
        functionName: task.name,
        description: task.description,
        scheduleType,
        cronSchedule: task.schedule.cron,
        eventName: task.schedule.event,
        category: task.category,
        retries: task.retries || 3,
        concurrencyLimit: task.concurrencyLimit || 1,
        timeout: task.timeout ? task.timeout * 1000 : 300000, // Convert to ms
        metadata: task.metadata,
        codeVersion: process.env.npm_package_version || '1.0.0',
      });

      if (existing) {
        updated++;
      } else {
        created++;
      }

      logger.info('Task synced', {
        context: 'task-registry',
        metadata: {
          taskId: task.id,
          category: task.category,
          action: existing ? 'updated' : 'created',
        },
      });
    }

    logger.info('Task registry sync completed', {
      context: 'task-registry',
      metadata: { synced: taskArray.length, created, updated },
    });

    return {
      synced: taskArray.length,
      created,
      updated,
    };
  } catch (error) {
    logger.error('Task registry sync failed', error, {
      context: 'task-registry',
    });
    throw error;
  }
}
