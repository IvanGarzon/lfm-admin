# Task Scheduler

A robust background task scheduling system with retry policies, concurrent execution prevention, and comprehensive logging.

## Run tasks locally

```
yarn workspace @duke-hq/svc-scheduled-tasks run local
```

## Writing a New Scheduled Task

### Quick Start

1. **Create a new task file** in `src/tasks/example.ts`:

2. **Use this template**:

   ```typescript
   import { TaskDefinition } from '../lib';
   import { db } from '../index';

   // the export name of your task will become it's name in the database
   export const example: TaskDefinition = {
     schedule: {
       cron: '0 2 * * *', // Daily at 2 AM
       timezone: 'Australia/Sydney',
       enabled: true,
     },
     timeout: 5, // 5 minutes max
     retryPolicy: 'retry-on-fail',
     handler: async (span) => {
       // Your task logic here
       const userCount = await db.user.count();

       // return a simple sentence explaining what was or wasn't done
       return `There are ${userCount} users in the admin database.`;
     },
   };
   ```

3. **Register your task** in `src/tasks/index.ts`:

   ```typescript
   import { TaskDefinition } from '../lib';
   import { example } from './example';

   export const tasks: Record<string, TaskDefinition> = {
     example, // Add your task here
   };
   ```

4. **Test your task**:
   ```bash
   yarn run tsc
   yarn run eslint
   yarn run vitest
   ```

### Common Cron Patterns

```typescript
'0 * * * *'; // Every hour
'*/15 * * * *'; // Every 15 minutes
'0 0 * * *'; // Daily at midnight
'0 9 * * 1-5'; // Weekdays at 9 AM
'0 0 1 * *'; // Monthly on 1st
'0 2 * * 0'; // Weekly on Sunday at 2 AM
```

### Task Properties

- **`schedule.cron`**: When to run (required)
- **`schedule.timezone`**: Timezone for schedule (optional, defaults to UTC)
- **`schedule.enabled`**: Can disable task (optional, defaults to true)
- **`timeout`**: Max runtime in minutes, 1-9 (required)
- **`retryPolicy`**: `'retry-on-fail'` or `'ignore'` (required)
- **`handler`**: Your task function (required)

See [example.ts](src/tasks/example.ts) for a complete working example.

## Key Features

- **Retry Policies**: `'retry-on-fail'` retries failed tasks, `'ignore'` logs failures without retry
- **Timeouts**: Tasks are terminated if they exceed their configured timeout (1-9 minutes)
- **Concurrency Protection**: Database locks prevent the same task from running multiple times
- **Logging**: Use `span.log()` for structured logging and debugging

## Best Practices

1. **Keep tasks idempotent** - Safe to run multiple times
2. **Use appropriate timeouts** - Set realistic timeouts based on expected execution time
3. **Log meaningful information** - Use the span object for instrumentation
4. **Only use local Prisma clients** - Scheduled tasks must rely on the Prisma clients provided by this package rather than pulling in application-specific clients.
