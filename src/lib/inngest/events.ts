/**
 * Inngest Event Types
 *
 * Type-safe event definitions for all Inngest events in the application.
 * This provides compile-time type checking when sending events.
 */

import type { QueueEmailPayload } from '@/types/email';

/**
 * Email send event - triggers the send-email function
 */
export type EmailSendEvent = {
  name: 'email/send';
  data: {
    auditId: string;
    email: QueueEmailPayload;
  };
};

/**
 * Manual trigger event for send-email function
 */
export type SendEmailManualEvent = {
  name: 'send-email/manual';
  data: {
    triggeredBy?: string;
    executionId?: string;
    auditId?: string;
    email?: QueueEmailPayload;
  };
};

/**
 * Manual trigger event for mark-overdue-invoices function
 */
export type MarkOverdueInvoicesManualEvent = {
  name: 'mark-overdue-invoices/manual';
  data: {
    triggeredBy?: string;
    executionId?: string;
  };
};

/**
 * Manual trigger event for check-expired-quotes function
 */
export type CheckExpiredQuotesManualEvent = {
  name: 'check-expired-quotes/manual';
  data: {
    triggeredBy?: string;
    executionId?: string;
  };
};

/**
 * Manual trigger event for quote-expiry-reminder function
 */
export type QuoteExpiryReminderManualEvent = {
  name: 'quote-expiry-reminder/manual';
  data: {
    triggeredBy?: string;
    executionId?: string;
  };
};

/**
 * Manual trigger event for cleanup-sessions function
 */
export type CleanupSessionsManualEvent = {
  name: 'cleanup-sessions/manual';
  data: {
    triggeredBy?: string;
    executionId?: string;
  };
};

/**
 * Union type of all Inngest events
 */
export type InngestEvents = {
  'email/send': EmailSendEvent;
  'send-email/manual': SendEmailManualEvent;
  'mark-overdue-invoices/manual': MarkOverdueInvoicesManualEvent;
  'check-expired-quotes/manual': CheckExpiredQuotesManualEvent;
  'quote-expiry-reminder/manual': QuoteExpiryReminderManualEvent;
  'cleanup-sessions/manual': CleanupSessionsManualEvent;
};
