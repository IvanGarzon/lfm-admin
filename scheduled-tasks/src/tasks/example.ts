import { TaskDefinition } from '../lib';
import { db } from '@duke-hq/svc-api-db/connection';

export const example: TaskDefinition = {
  schedule: {
    cron: '15 * * * *',
    timezone: 'Australia/Sydney',
    enabled: true,
  },
  timeout: 1,
  retryPolicy: 'retry-on-fail',
  handler: async (span) => {
    const userCount = await db.user.count();
    span.setAttributes({
      userCount,
    });

    return `Example task completed: there are ${userCount} users in the admin database.`;
  },
};
