/**
 * Inngest API Route
 *
 * This endpoint serves Inngest functions to the Inngest platform.
 * Inngest will call this endpoint to execute background jobs.
 *
 * URL: /api/inngest
 */

import { serve } from 'inngest/next';
import { inngest } from '@/lib/inngest/client';
import { getAllInngestFunctions } from '@/tasks';

/**
 * Get all Inngest functions from the task registry
 *
 * Tasks are now defined in /src/tasks with clean TypeScript definitions.
 * The task registry automatically extracts Inngest functions for registration.
 *
 * To add a new task:
 * 1. Create a task definition in /src/tasks
 * 2. Add it to the task registry in /src/tasks/index.ts
 * 3. Call POST /api/tasks/sync to sync to database
 */
const functions = getAllInngestFunctions();

/**
 * Serve Inngest functions
 */
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions,
});
