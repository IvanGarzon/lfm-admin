// Re-export the unified database clients from the API service
// This ensures scheduled tasks use the same client creation logic
// with secure SSM parameter fetching
import { db } from '@duke-hq/svc-api-db/connection';

import { TaskScheduler } from './lib/taskScheduler';
import { PrismaTaskSchedulerDatabase } from './lib/database/prisma';
import { tasks } from './tasks';

export async function handler() {
  const database = new PrismaTaskSchedulerDatabase(db);
  try {
    const scheduler = new TaskScheduler(tasks, database);

    await scheduler.run();

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Task scheduler completed successfully',
        timestamp: new Date().toISOString(),
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Task scheduler failed',
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
      }),
    };
  } finally {
    await Promise.allSettled([db.$disconnect()]);
  }
}
