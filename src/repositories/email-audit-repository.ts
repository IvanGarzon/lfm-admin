import { EmailAudit, EmailStatus, PrismaClient } from '@/prisma/client';

/**
 * EmailAudit Repository
 * Handles all database operations for email audit records.
 */
export class EmailAuditRepository {
  constructor(private prisma: PrismaClient) {}

  /**
   * Create a new email audit record.
   * @param data - The email audit data
   * @returns A promise that resolves to the created audit record
   */
  async create(data: {
    emailType: string;
    templateName: string;
    recipient: string;
    subject: string;
    invoiceId?: string;
    quoteId?: string;
    customerId?: string;
    inngestEventId?: string;
    metadata?: Record<string, unknown>;
  }): Promise<EmailAudit> {
    return this.prisma.emailAudit.create({
      data: {
        ...data,
        status: EmailStatus.QUEUED,
      },
    });
  }

  /**
   * Find an email audit record by ID, selecting only status and sentAt.
   * Used for idempotency checks before processing.
   * @param id - The audit record ID
   * @returns A promise that resolves to the status fields or null if not found
   */
  async findStatusById(id: string): Promise<Pick<EmailAudit, 'status' | 'sentAt'> | null> {
    return this.prisma.emailAudit.findUnique({
      where: { id },
      select: { status: true, sentAt: true },
    });
  }

  /**
   * Update an email audit record with the Inngest event ID after queuing.
   * @param id - The audit record ID
   * @param inngestEventId - The Inngest event ID to store
   * @returns A promise that resolves to the updated audit record
   */
  async updateInngestEventId(id: string, inngestEventId: string): Promise<EmailAudit> {
    return this.prisma.emailAudit.update({
      where: { id },
      data: { inngestEventId },
    });
  }

  /**
   * Mark an email audit record as SENDING when Inngest begins processing.
   * @param id - The audit record ID
   * @param inngestRunId - The Inngest run ID for cross-referencing
   * @returns A promise that resolves to the updated audit record
   */
  async markAsSending(id: string, inngestRunId: string | undefined): Promise<EmailAudit> {
    return this.prisma.emailAudit.update({
      where: { id },
      data: { status: EmailStatus.SENDING, inngestRunId },
    });
  }

  /**
   * Mark an email audit record as SENT after successful delivery.
   * @param id - The audit record ID
   * @param emailId - The external email provider ID returned after sending
   * @param existingMetadata - Existing metadata to merge with
   * @returns A promise that resolves to the updated audit record
   */
  async markAsSent(
    id: string,
    emailId: string | undefined,
    existingMetadata: Record<string, unknown>,
  ): Promise<EmailAudit> {
    return this.prisma.emailAudit.update({
      where: { id },
      data: {
        status: EmailStatus.SENT,
        sentAt: new Date(),
        metadata: { ...existingMetadata, emailId },
      },
    });
  }

  /**
   * Mark an email audit record as FAILED and increment the retry count.
   * @param id - The audit record ID
   * @param errorMessage - The error message to store
   * @returns A promise that resolves to the updated audit record
   */
  async markAsFailed(id: string, errorMessage: string): Promise<EmailAudit> {
    return this.prisma.emailAudit.update({
      where: { id },
      data: {
        status: EmailStatus.FAILED,
        failedAt: new Date(),
        errorMessage,
        retryCount: { increment: 1 },
      },
    });
  }

  /**
   * Find the most recent sent email for a quote of a given type, after a given date.
   * Used for rate limiting to prevent duplicate emails.
   * @param quoteId - The quote ID
   * @param emailType - The email type to search for (e.g. 'quote.followup')
   * @param since - Only look for emails sent after this date
   * @returns A promise that resolves to the audit record or null if not found
   */
  async findLastSentByQuote(
    quoteId: string,
    emailType: string,
    since: Date,
  ): Promise<EmailAudit | null> {
    return this.prisma.emailAudit.findFirst({
      where: {
        quoteId,
        emailType,
        status: EmailStatus.SENT,
        sentAt: { gte: since },
      },
      orderBy: { sentAt: 'desc' },
    });
  }

  /**
   * Find the most recent sent email for an invoice of a given type, after a given date.
   * Used for rate limiting to prevent duplicate reminder emails.
   * @param invoiceId - The invoice ID
   * @param emailType - The email type to search for (e.g. 'invoice.reminder')
   * @param since - Only look for emails sent after this date
   * @returns A promise that resolves to the audit record or null if not found
   */
  async findLastSentByInvoice(
    invoiceId: string,
    emailType: string,
    since: Date,
  ): Promise<EmailAudit | null> {
    return this.prisma.emailAudit.findFirst({
      where: {
        invoiceId,
        emailType,
        status: EmailStatus.SENT,
        sentAt: { gte: since },
      },
      orderBy: { sentAt: 'desc' },
    });
  }

  /**
   * Find the most recent sent email for a customer of a given type, after a given date.
   * Used for rate limiting to prevent email bombing across multiple invoices.
   * @param customerId - The customer ID
   * @param emailType - The email type to search for (e.g. 'invoice.reminder')
   * @param since - Only look for emails sent after this date
   * @returns A promise that resolves to the audit record or null if not found
   */
  async findLastSentByCustomer(
    customerId: string,
    emailType: string,
    since: Date,
  ): Promise<EmailAudit | null> {
    return this.prisma.emailAudit.findFirst({
      where: {
        customerId,
        emailType,
        status: EmailStatus.SENT,
        sentAt: { gte: since },
      },
      orderBy: { sentAt: 'desc' },
    });
  }
}
