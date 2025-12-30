/**
 * Inngest Client Configuration
 *
 * Initialize Inngest client for sending events and creating functions.
 */

import { Inngest } from 'inngest';
import { env } from '@/env';
import { taskInterceptor } from './middleware/task-interceptor';

/**
 * Inngest client instance
 *
 * This client is used to:
 * 1. Send events to Inngest (inngest.send())
 * 2. Create background functions (inngest.createFunction())
 */
export const inngest = new Inngest({
  id: env.INNGEST_APP_ID || 'lfm-admin',
  name: 'LFM Admin',

  //  Event key for production security (optional)
  eventKey: env.INNGEST_EVENT_KEY,

  // Middleware for task management
  middleware: [taskInterceptor()],
});
