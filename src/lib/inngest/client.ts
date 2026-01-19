/**
 * Inngest Client Configuration
 *
 * Initialize Inngest client for sending events and creating functions.
 */

import { Inngest } from 'inngest';
import { env } from '@/env';
import { taskInterceptor } from './middleware/task-interceptor';
import type {
  InngestEvents,
  EmailSendEvent,
  SendEmailManualEvent,
  MarkOverdueInvoicesManualEvent,
  CheckExpiredQuotesManualEvent,
  QuoteExpiryReminderManualEvent,
  CleanupSessionsManualEvent,
} from './events';

/**
 * Inngest client instance
 *
 * This client is used to:
 * 1. Send events to Inngest - use typed helpers below for type safety
 * 2. Create background functions (inngest.createFunction())
 *
 * Events are typed - see src/lib/inngest/events.ts for available events.
 */
export const inngest = new Inngest({
  id: env.INNGEST_APP_ID || 'lfm-admin',
  name: 'LFM Admin',

  //  Event key for production security (optional)
  eventKey: env.INNGEST_EVENT_KEY,

  // Middleware for task management
  middleware: [taskInterceptor()],
});

/**
 * Type-safe event sending helpers
 *
 * Use these instead of inngest.send() directly for compile-time type checking.
 */

type SendEventOptions = { id?: string };

export async function sendEmailEvent(data: EmailSendEvent['data'], options?: SendEventOptions) {
  return inngest.send({
    id: options?.id,
    name: 'email/send',
    data,
  });
}

export async function sendManualTriggerEvent<T extends keyof InngestEvents>(
  eventName: T,
  data: InngestEvents[T]['data'],
  options?: SendEventOptions,
) {
  return inngest.send({
    id: options?.id,
    name: eventName,
    data,
  });
}

/**
 * Re-export event types for consumers
 */
export type {
  InngestEvents,
  EmailSendEvent,
  SendEmailManualEvent,
  MarkOverdueInvoicesManualEvent,
  CheckExpiredQuotesManualEvent,
  QuoteExpiryReminderManualEvent,
  CleanupSessionsManualEvent,
};
