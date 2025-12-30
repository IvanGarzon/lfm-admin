// Run the scheduled tasks locally
//
// yarn workspace @duke-hq/svc-scheduled-tasks run local

import { db } from '@duke-hq/svc-api-db/connection';
import { PrismaTaskSchedulerDatabase } from './lib/database/prisma';
import { TaskScheduler } from './lib/taskScheduler';
import { tasks } from './tasks';

async function run() {
  const scheduler = new TaskScheduler(tasks, new PrismaTaskSchedulerDatabase(db));

  await scheduler.run();
}

run().catch(console.error);
