'use server';

import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';
import { InvoiceRepository } from '@/repositories/invoice-repository';
import { prisma } from '@/lib/prisma';
import { handleActionError } from '@/lib/error-handler';
import { logger } from '@/lib/logger';
import {
  CreateInvoiceSchema,
  UpdateInvoiceSchema,
  RecordPaymentSchema,
  MarkInvoiceAsPendingSchema,
  CancelInvoiceSchema,
  type CreateInvoiceInput,
  type UpdateInvoiceInput,
  type RecordPaymentInput,
  type MarkInvoiceAsPendingInput,
  type CancelInvoiceInput,  
} from '@/schemas/invoices';
import { requirePermission } from '@/lib/permissions';
import { InvoiceStatus } from '@/prisma/client';
import type { ActionResult } from '@/types/actions';

const invoiceRepo = new InvoiceRepository(prisma);

/**
 * Creates a new invoice with the provided data.
 * It calculates the total amount and generates a new invoice number.
 * @param data - The input data for creating the invoice, conforming to `CreateInvoiceInput`.
 * @returns A promise that resolves to an `ActionResult` with the new invoice's ID and number.
 */
export async function createInvoice(
  data: CreateInvoiceInput,
): Promise<ActionResult<{ id: string; invoiceNumber: string }>> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: 'Unauthorized' };
  }

  try {    
    requirePermission(session.user, 'canManageInvoices');
    const validatedData = CreateInvoiceSchema.parse(data);
    
    const invoice = await invoiceRepo.createInvoiceWithItems(validatedData, session.user.id);

    revalidatePath('/finances/invoices');

    return {
      success: true,
      data: { id: invoice.id, invoiceNumber: invoice.invoiceNumber },
    };
  } catch (error) {
    return handleActionError(error, 'Failed to create invoice');
  }
}

/**
 * Updates an existing invoice with the provided data.
 * It recalculates the total amount and handles updates to invoice items.
 * @param data - The input data for updating the invoice, conforming to `UpdateInvoiceInput`.
 * @returns A promise that resolves to an `ActionResult` with the updated invoice's ID.
 */
export async function updateInvoice(
  data: UpdateInvoiceInput,
): Promise<ActionResult<{ id: string }>> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    requirePermission(session.user, 'canManageInvoices');
    const validatedData = UpdateInvoiceSchema.parse(data);
    const existing = await invoiceRepo.findById(validatedData.id);
    if (!existing) {
      return { success: false, error: 'Invoice not found' };
    }

    const invoice = await invoiceRepo.updateInvoiceWithItems(validatedData.id, validatedData);

    if (!invoice) {
      return { success: false, error: 'Failed to update invoice' };
    }

    revalidatePath('/finances/invoices');
    revalidatePath(`/finances/invoices/${invoice.id}`);

    return { success: true, data: { id: invoice.id } };
  } catch (error) {
    return handleActionError(error, 'Failed to update invoice');
  }
}

/**
 * Marks an invoice as pending.
 * @param data - An object containing the invoice ID.
 * @returns A promise that resolves to an `ActionResult` with the invoice's ID upon success,
 * or an error if the invoice is not found.
 */
export async function markInvoiceAsPending(
  data: MarkInvoiceAsPendingInput,
): Promise<ActionResult<{ id: string }>> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    requirePermission(session.user, 'canManageInvoices');
    const validatedInvoice = MarkInvoiceAsPendingSchema.parse(data);
    const invoice = await invoiceRepo.markAsPending(validatedInvoice.id, session.user.id);

    if (!invoice) {
      return { success: false, error: 'Invoice not found' };
    }

    // Queue email for background processing via Inngest
    const { queueInvoiceEmail } = await import('@/services/email-queue.service');

    queueInvoiceEmail({
      invoiceId: invoice.id,
      customerId: invoice.customer.id,
      type: 'pending',
      recipient: invoice.customer.email,
      subject: `Invoice ${invoice.invoiceNumber}`,
      emailData: {
        invoiceNumber: invoice.invoiceNumber,
        customerName: `${invoice.customer.firstName} ${invoice.customer.lastName}`,
        amount: Number(invoice.amount),
        currency: invoice.currency,
        dueDate: invoice.dueDate,
        issuedDate: invoice.issuedDate,
      },
    }).catch(err => {
      logger.error('Failed to queue invoice email', err, {
        context: 'markInvoiceAsPending',
        metadata: { invoiceId: invoice.id }
      });
    });

    logger.info('Invoice marked as pending, email queued', {
      context: 'markInvoiceAsPending',
      metadata: {
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
      },
    });

    revalidatePath('/finances/invoices');
    revalidatePath(`/finances/invoices/${invoice.id}`);

    return { success: true, data: { id: invoice.id } };
  } catch (error) {
    return handleActionError(error, 'Failed to mark invoice as pending');
  }
}

/**
 * Reverts an invoice to draft status.
 * @param id - The ID of the invoice to revert.
 * @returns A promise that resolves to an `ActionResult` with the invoice's ID upon success.
 */
export async function markInvoiceAsDraft(id: string): Promise<ActionResult<{ id: string }>> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    requirePermission(session.user, 'canManageInvoices');
    const invoice = await invoiceRepo.markAsDraft(id, session.user.id);

    if (!invoice) {
      return { success: false, error: 'Invoice not found' };
    }

    revalidatePath('/finances/invoices');
    revalidatePath(`/finances/invoices/${id}`);

    return { success: true, data: { id } };
  } catch (error) {
    return handleActionError(error, 'Failed to revert invoice to draft');
  }
}

/**
 * Records a payment against an invoice.
 * @param data - The payment data including amount, method, and date.
 * @returns A promise that resolves to an `ActionResult` with the invoice's ID, status, and receipt number upon success.
 */
export async function recordPayment(
  data: RecordPaymentInput,
): Promise<ActionResult<{ id: string; status: string; receiptNumber?: string | null }>> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    // Check permission to record payments
    requirePermission(session.user, 'canRecordPayments');
    const validatedData = RecordPaymentSchema.parse(data);

    const invoice = await invoiceRepo.addPayment(
      validatedData.id,
      validatedData.amount,
      validatedData.paymentMethod,
      validatedData.paidDate,
      validatedData.notes,
      session.user.id,
    );

    if (!invoice) {
      return { success: false, error: 'Invoice not found' };
    }

    revalidatePath('/finances/invoices');
    revalidatePath(`/finances/invoices/${validatedData.id}`);

    return {
      success: true,
      data: {
        id: invoice.id,
        status: invoice.status,
        receiptNumber: invoice.receiptNumber,
      }
    };
  } catch (error) {
    return handleActionError(error, 'Failed to record payment', {
      action: 'recordPayment',
      userId: session.user.id,
      invoiceId: data.id,
      amount: data.amount,
    });
  }
}

/**
 * Cancels an invoice.
 * @param data - An object containing the invoice ID, the cancellation date, and the reason for cancellation.
 * @returns A promise that resolves to an `ActionResult` with the invoice's ID upon success,
 * or an error if the invoice is not found.
 */
export async function cancelInvoice(
  data: CancelInvoiceInput,
): Promise<ActionResult<{ id: string }>> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    requirePermission(session.user, 'canManageInvoices');
    const validatedData = CancelInvoiceSchema.parse(data);

    const invoice = await invoiceRepo.cancel(
      validatedData.id,
      validatedData.cancelledDate,
      validatedData.cancelReason,
      session.user.id,
    );

    if (!invoice) {
      return { success: false, error: 'Invoice not found' };
    }

    revalidatePath('/finances/invoices');
    revalidatePath(`/finances/invoices/${validatedData.id}`);

    return { success: true, data: { id: invoice.id } };
  } catch (error) {
    return handleActionError(error, 'Failed to cancel invoice');
  }
}

/**
 * Sends a receipt email for a paid invoice with PDF attachment.
 * @param id - The ID of the invoice to send a receipt for.
 * @returns A promise that resolves to an `ActionResult` with the invoice's ID upon success.
 */
export async function sendInvoiceReceipt(id: string): Promise<ActionResult<{ id: string }>> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    // Get full invoice details
    let invoice = await invoiceRepo.findByIdWithDetails(id);
    
    if (!invoice) {
      return { success: false, error: 'Invoice not found' };
    }

    // Validate invoice is paid
    if (invoice.status !== 'PAID') {
      return { success: false, error: 'Invoice must be marked as paid before sending receipt' };
    }

    // Ensure receipt number exists (should be generated when marked as paid)
    if (!invoice.receiptNumber) {
      logger.warn('Receipt number missing, generating now', {
        context: 'sendInvoiceReceipt',
        metadata: { invoiceId: id },
      });

      // Generate receipt number if missing
      const receiptNumber = await invoiceRepo.generateReceiptNumber();

      // Update invoice with receipt number
      await prisma.invoice.update({
        where: { id },
        data: { receiptNumber },
      });

      // Refetch invoice with receipt number
      const updatedInvoice = await invoiceRepo.findByIdWithDetails(id);
      if (!updatedInvoice) {
        return { success: false, error: 'Failed to update invoice' };
      }

      invoice = updatedInvoice;
    }

    // Queue receipt email for background processing via Inngest
    const { queueInvoiceEmail } = await import('@/services/email-queue.service');

    queueInvoiceEmail({
      invoiceId: invoice.id,
      customerId: invoice.customer.id,
      type: 'receipt',
      recipient: invoice.customer.email,
      subject: `Payment Receipt ${invoice.receiptNumber || invoice.invoiceNumber}`,
      emailData: {
        invoiceNumber: invoice.invoiceNumber,
        receiptNumber: invoice.receiptNumber,
        customerName: `${invoice.customer.firstName} ${invoice.customer.lastName}`,
        amount: Number(invoice.amount),
        currency: invoice.currency,
        paidDate: invoice.paidDate || new Date(),
        paymentMethod: invoice.paymentMethod || 'Not specified',
      },
    }).catch(err => {
      logger.error('Failed to queue receipt email', err, {
        context: 'sendInvoiceReceipt',
        metadata: { invoiceId: invoice.id }
      });
    });

    logger.info('Receipt email queued', {
      context: 'sendInvoiceReceipt',
      metadata: {
        invoiceId: id,
        invoiceNumber: invoice.invoiceNumber,
        receiptNumber: invoice.receiptNumber,
      },
    });

    return { success: true, data: { id: invoice.id } };
  } catch (error) {
    logger.error('Failed to send receipt email', error, {
      context: 'sendInvoiceReceipt',
      metadata: { invoiceId: id },
    });

    return handleActionError(error, 'Failed to send receipt');
  }
}

/**
 * Updates the status of multiple invoices in a single operation.
 * @param ids - An array of invoice IDs to update.
 * @param status - The new status to apply to the invoices.
 * @returns A promise that resolves to an `ActionResult` containing bulk update results, 
 * including success and failure counts and individual operation results.
 */
export async function bulkUpdateInvoiceStatus(
  ids: string[],
  status: InvoiceStatus,
): Promise<ActionResult<{ successCount: number; failureCount: number; results: { id: string; success: boolean; error?: string }[] }>> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    const results = await invoiceRepo.bulkUpdateStatus(ids, status, session.user.id);
    
    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;
    
    revalidatePath('/finances/invoices');

    return { 
      success: true, 
      data: { 
        successCount, 
        failureCount,
        results 
      } 
    };
  } catch (error) {
    return handleActionError(error, 'Failed to update invoices');
  }
}

/**
 * Sends a payment reminder email to the customer for an overdue invoice.
 * @param id - The ID of the overdue invoice.
 * @returns A promise that resolves to an `ActionResult` with the invoice's ID upon success.
 */
export async function sendInvoiceReminder(id: string): Promise<ActionResult<{ id: string }>> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    // Get full invoice details
    const invoice = await invoiceRepo.findByIdWithDetails(id);

    if (!invoice) {
      return { success: false, error: 'Invoice not found' };
    }

    // Calculate days overdue
    const dueDate = new Date(invoice.dueDate);
    const today = new Date();
    const daysOverdue = Math.max(
      0,
      Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
    );

    // Only send reminder if invoice is actually overdue
    if (daysOverdue <= 0) {
      return { success: false, error: 'Cannot send reminder for invoice that is not overdue' };
    }

    // Rate limiting: 1 reminder per invoice per 24 hours
    const lastInvoiceReminder = await prisma.emailAudit.findFirst({
      where: {
        invoiceId: id,
        emailType: 'invoice.reminder',
        status: 'SENT',
        sentAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        },
      },
      orderBy: { sentAt: 'desc' },
    });

    if (lastInvoiceReminder) {
      return {
        success: false,
        error: `A reminder was already sent for this invoice today (at ${lastInvoiceReminder.sentAt?.toLocaleTimeString()}).`,
      };
    }

    // Rate limiting: 1 reminder per customer per 1 hour (prevent email bombing across multiple invoices)
    const lastCustomerReminder = await prisma.emailAudit.findFirst({
      where: {
        customerId: invoice.customer.id,
        emailType: 'invoice.reminder',
        status: 'SENT',
        sentAt: {
          gte: new Date(Date.now() - 60 * 60 * 1000), // Last 1 hour
        },
      },
      orderBy: { sentAt: 'desc' },
    });

    if (lastCustomerReminder) {
      return {
        success: false,
        error: 'A reminder was recently sent to this customer for another invoice. Please wait at least an hour before sending another one.',
      };
    }

    // Queue reminder email for background processing via Inngest
    const { queueInvoiceEmail } = await import('@/services/email-queue.service');

    queueInvoiceEmail({
      invoiceId: invoice.id,
      customerId: invoice.customer.id,
      type: 'reminder',
      recipient: invoice.customer.email,
      subject: `Payment Reminder: Invoice ${invoice.invoiceNumber} - ${daysOverdue} Days Overdue`,
      emailData: {
        invoiceNumber: invoice.invoiceNumber,
        customerName: `${invoice.customer.firstName} ${invoice.customer.lastName}`,
        amount: Number(invoice.amount),
        currency: invoice.currency,
        dueDate: invoice.dueDate,
        daysOverdue,
        amountPaid: Number(invoice.amountPaid),
        amountDue: Number(invoice.amountDue),
      },
    }).catch(err => {
      logger.error('Failed to queue reminder email', err, {
        context: 'sendInvoiceReminder',
        metadata: { invoiceId: invoice.id }
      });
    });

    const updatedInvoice = await invoiceRepo.incrementReminderCount(id);
    if (!updatedInvoice) {
      return { success: false, error: 'Failed to update reminder count' };
    }

    logger.info('Reminder email queued', {
      context: 'sendInvoiceReminder',
      metadata: {
        invoiceId: id,
        invoiceNumber: invoice.invoiceNumber,
        daysOverdue,
      },
    });

    revalidatePath('/finances/invoices');
    revalidatePath(`/finances/invoices/${id}`);

    return { success: true, data: { id: updatedInvoice.id } };
  } catch (error) {
    logger.error('Failed to send reminder email', error, {
      context: 'sendInvoiceReminder',
      metadata: { invoiceId: id },
    });

    return handleActionError(error, 'Failed to send reminder');
  }
}

/**
 * Soft deletes an invoice by setting its `deletedAt` timestamp.
 * Only DRAFT invoices can be deleted. For other statuses, use cancelInvoice instead.
 * The invoice is not permanently removed from the database.
 * @param id - The ID of the invoice to delete.
 * @returns A promise that resolves to an `ActionResult` with the ID of the soft-deleted invoice,
 * or an error if the invoice is not found or is not in DRAFT status.
 */
export async function deleteInvoice(id: string): Promise<ActionResult<{ id: string }>> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    requirePermission(session.user, 'canManageInvoices');
    const success = await invoiceRepo.softDelete(id);

    if (!success) {
      return { success: false, error: 'Invoice not found' };
    }

    revalidatePath('/finances/invoices');

    return { success: true, data: { id } };
  } catch (error) {
    return handleActionError(error, 'Failed to delete invoice');
  }
}

/**
 * Duplicates an existing invoice creating a new DRAFT invoice.
 * Copies all invoice details and items but resets payment-related fields.
 * The new invoice gets a fresh invoice number and starts in DRAFT status.
 * @param id - The ID of the invoice to duplicate.
 * @returns A promise that resolves to an `ActionResult` with the new invoice's ID and number.
 */
export async function duplicateInvoice(
  id: string,
): Promise<ActionResult<{ id: string; invoiceNumber: string }>> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    const result = await invoiceRepo.duplicate(id);

    revalidatePath('/finances/invoices');

    return {
      success: true,
      data: { id: result.id, invoiceNumber: result.invoiceNumber },
    };
  } catch (error) {
    return handleActionError(error, 'Failed to duplicate invoice');
  }
}
