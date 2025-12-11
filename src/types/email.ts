/**
 * Generic Email Types
 *
 * Reusable email types that work across all features (invoices, quotes, reports, etc.)
 */

import { z } from 'zod';

/**
 * Email types supported by the system
 */
export const EmailTypeEnum = z.enum([
  // Invoice-related
  'invoice.pending',
  'invoice.reminder',
  'invoice.receipt',
  'invoice.overdue',

  // Quote-related
  'quote.sent',
  'quote.reminder',
  'quote.accepted',
  'quote.rejected',
  'quote.expired',

  // Report-related
  'report.monthly',
  'report.weekly',
  'report.custom',

  // Customer-related
  'customer.welcome',
  'customer.notification',
]);

export type EmailType = z.infer<typeof EmailTypeEnum>;

/**
 * Email template names (maps to email template components)
 */
export const EmailTemplateEnum = z.enum([
  'invoice',
  'receipt',
  'reminder',
  'quote',
  'report',
  'notification',
]);

export type EmailTemplate = z.infer<typeof EmailTemplateEnum>;

/**
 * Entity types that can have emails associated
 */
export const EmailEntityTypeEnum = z.enum([
  'invoice',
  'quote',
  'customer',
  'report',
]);

export type EmailEntityType = z.infer<typeof EmailEntityTypeEnum>;

/**
 * Generic email queue payload
 */
export const QueueEmailSchema = z.object({
  // Entity information (polymorphic)
  entityType: EmailEntityTypeEnum,
  entityId: z.string(),

  // Email details
  emailType: EmailTypeEnum,
  templateName: EmailTemplateEnum,
  recipient: z.string().email(),
  subject: z.string(),

  // Optional associations
  customerId: z.string().optional(),
  invoiceId: z.string().optional(),
  quoteId: z.string().optional(),

  // Email data (will be passed to template)
  emailData: z.record(z.any()),

  // Attachments
  attachments: z.array(z.object({
    filename: z.string(),
    url: z.string().optional(),
    generatePdf: z.boolean().optional(), // If true, generate PDF from entity
  })).optional(),

  // Priority (for future use)
  priority: z.enum(['high', 'normal', 'low']).default('normal'),

  // Metadata
  metadata: z.record(z.any()).optional(),
});

export type QueueEmailPayload = z.infer<typeof QueueEmailSchema>;

/**
 * Inngest event payload for email sending
 */
export const EmailEventPayloadSchema = z.object({
  // Unique event ID (for deduplication)
  eventId: z.string().optional(),

  // Email payload
  email: QueueEmailSchema,
});

export type EmailEventPayload = z.infer<typeof EmailEventPayloadSchema>;

/**
 * Email audit create input
 */
export const CreateEmailAuditSchema = z.object({
  emailType: z.string(),
  templateName: z.string(),
  recipient: z.string(),
  subject: z.string(),

  // Optional associations
  invoiceId: z.string().optional(),
  quoteId: z.string().optional(),
  customerId: z.string().optional(),

  // Inngest metadata
  inngestEventId: z.string().optional(),
  inngestRunId: z.string().optional(),

  // Additional metadata
  metadata: z.record(z.any()).optional(),
});

export type CreateEmailAuditInput = z.infer<typeof CreateEmailAuditSchema>;

/**
 * Email audit update input
 */
export const UpdateEmailAuditSchema = z.object({
  status: z.enum(['QUEUED', 'SENDING', 'SENT', 'FAILED', 'RETRYING']).optional(),
  sentAt: z.date().optional(),
  failedAt: z.date().optional(),
  errorMessage: z.string().optional(),
  retryCount: z.number().optional(),
  inngestRunId: z.string().optional(),
});

export type UpdateEmailAuditInput = z.infer<typeof UpdateEmailAuditSchema>;
