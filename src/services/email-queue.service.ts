/**
 * Email Queue Service
 *
 * Generic service for queuing emails via Inngest.
 * Works for all features: invoices, quotes, reports, etc.
 */

import { inngest } from '@/lib/inngest/client';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { ScheduledTaskRepository } from '@/repositories/scheduled-task-repository';
import type { QueueEmailPayload } from '@/types/email';

/**
 * Queue an email for background processing
 *
 * This function:
 * 1. Creates an email audit record in the database (status: QUEUED)
 * 2. Sends an event to Inngest to process the email
 * 3. Returns immediately (non-blocking)
 *
 * @param payload - Email queue payload
 * @returns Promise with the email audit ID
 *
 * @example
 * ```typescript
 * await queueEmail({
 *   entityType: 'invoice',
 *   entityId: invoice.id,
 *   emailType: 'invoice.pending',
 *   templateName: 'invoice',
 *   recipient: customer.email,
 *   subject: `Invoice ${invoice.invoiceNumber}`,
 *   customerId: customer.id,
 *   invoiceId: invoice.id,
 *   emailData: {
 *     invoiceNumber: invoice.invoiceNumber,
 *     amount: invoice.amount,
 *     //... other data
 *   },
 * });
 * ```
 */
export async function queueEmail(
  payload: QueueEmailPayload,
): Promise<{ auditId: string; eventId: string }> {
  try {
    // Check if send-email task is enabled
    const taskRepo = new ScheduledTaskRepository(prisma);
    const sendEmailTask = await taskRepo.findByFunctionId('send-email');

    if (sendEmailTask && !sendEmailTask.isEnabled) {
      logger.warn('send-email task is disabled, blocking email queue', {
        context: 'email-queue',
        metadata: {
          emailType: payload.emailType,
          recipient: payload.recipient,
          taskId: sendEmailTask.id,
        },
      });

      throw new Error(
        'Email sending is currently disabled. Please enable the send-email task to send emails.',
      );
    }

    // Create email audit record
    const emailAudit = await prisma.emailAudit.create({
      data: {
        emailType: payload.emailType,
        templateName: payload.templateName,
        // recipient: payload.recipient,
        recipient: 'ivangarzoncruz@gmail.com',
        subject: payload.subject,
        status: 'QUEUED',

        // Polymorphic relations
        invoiceId: payload.invoiceId,
        quoteId: payload.quoteId,
        customerId: payload.customerId,

        // Metadata
        metadata: {
          entityType: payload.entityType,
          entityId: payload.entityId,
          priority: payload.priority,
          attachments: payload.attachments,
          ...payload.metadata,
        },
      },
    });

    // Generate event ID for deduplication and tracking
    const eventId = `email-${emailAudit.id}`;

    // Send event to Inngest
    await inngest.send({
      id: eventId, // Deduplication key
      name: 'email/send',
      data: {
        auditId: emailAudit.id,
        email: payload,
      },
    });

    // Update audit record with Inngest event ID
    await prisma.emailAudit.update({
      where: { id: emailAudit.id },
      data: { inngestEventId: eventId },
    });

    logger.info('Email queued successfully', {
      context: 'email-queue',
      metadata: {
        auditId: emailAudit.id,
        eventId,
        emailType: payload.emailType,
        recipient: payload.recipient,
      },
    });

    return { auditId: emailAudit.id, eventId };
  } catch (error) {
    logger.error('Failed to queue email', error, {
      context: 'email-queue',
      metadata: {
        emailType: payload.emailType,
        recipient: payload.recipient,
      },
    });

    throw error;
  }
}

/**
 * Helper function to queue invoice emails
 */
export async function queueInvoiceEmail(params: {
  invoiceId: string;
  customerId: string;
  type: 'pending' | 'reminder' | 'receipt' | 'overdue';
  recipient: string;
  subject: string;
  emailData: Record<string, any>;
  attachments?: QueueEmailPayload['attachments'];
}) {
  return queueEmail({
    entityType: 'invoice',
    entityId: params.invoiceId,
    emailType: `invoice.${params.type}` as any,
    templateName:
      params.type === 'receipt' ? 'receipt' : params.type === 'reminder' ? 'reminder' : 'invoice',
    recipient: params.recipient,
    subject: params.subject,
    customerId: params.customerId,
    invoiceId: params.invoiceId,
    emailData: params.emailData,
    attachments: params.attachments,
    priority: params.type === 'reminder' || params.type === 'receipt' ? 'high' : 'normal',
  });
}

/**
 * Helper function to queue quote emails
 */
export async function queueQuoteEmail(params: {
  quoteId: string;
  customerId: string;
  type: 'sent' | 'reminder' | 'accepted' | 'rejected' | 'expired' | 'followup';
  recipient: string;
  subject: string;
  emailData: Record<string, any>;
  attachments?: QueueEmailPayload['attachments'];
}) {
  return queueEmail({
    entityType: 'quote',
    entityId: params.quoteId,
    emailType: `quote.${params.type}` as any,
    templateName: 'quote',
    recipient: params.recipient,
    subject: params.subject,
    customerId: params.customerId,
    quoteId: params.quoteId,
    emailData: params.emailData,
    attachments: params.attachments,
    priority: 'normal',
  });
}
