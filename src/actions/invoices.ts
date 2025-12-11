'use server';

import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';
import { SearchParams } from 'nuqs/server';
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
  InvoiceFiltersSchema,
  type CreateInvoiceInput,
  type UpdateInvoiceInput,
  type RecordPaymentInput,
  type MarkInvoiceAsPendingInput,
  type CancelInvoiceInput,  
} from '@/schemas/invoices';
import type {
  InvoiceFilters,
  InvoiceStatistics,
  InvoiceWithDetails,
  InvoicePagination,
} from '@/features/finances/invoices/types';
import type { ActionResult } from '@/types/actions';
import { requirePermission } from '@/lib/permissions';
import { InvoiceStatus } from '@/prisma/client';

const invoiceRepo = new InvoiceRepository(prisma);

/**
 * Retrieves a paginated list of invoices based on specified search and filter criteria.
 * @param searchParams - The search parameters for filtering, sorting, and pagination.
 * @returns A promise that resolves to an `ActionResult` containing the paginated invoice data.
 * @throws Will throw an error if the user is not authenticated or if the search parameters are invalid.
 *
 */
export async function getInvoices(
  searchParams: SearchParams,
): Promise<ActionResult<InvoicePagination>> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: 'Unauthorized' };
  }

  const parseResult = InvoiceFiltersSchema.safeParse(searchParams);
  if (!parseResult.success) {
    return { success: false, error: 'Invalid query parameters' };
  }

  try {
    const repoParams: InvoiceFilters = {
      search: parseResult.data.search,
      status: parseResult.data.status,
      page: parseResult.data.page,
      perPage: parseResult.data.perPage,
      sort: parseResult.data.sort,
    };

    const result = await invoiceRepo.searchAndPaginate(repoParams);

    return { success: true, data: result };
  } catch (error) {
    return handleActionError(error, 'Failed to fetch invoices');
  }
}

/**
 * Retrieves a single invoice by its unique identifier, including associated details.
 * @param id - The ID of the invoice to retrieve.
 * @returns A promise that resolves to an `ActionResult` containing the invoice details,
 * or an error if the invoice is not found.
 *
 */
export async function getInvoiceById(id: string): Promise<ActionResult<InvoiceWithDetails>> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    const invoice = await invoiceRepo.findByIdWithDetails(id);

    if (!invoice) {
      return { success: false, error: 'Invoice not found' };
    }

    return { success: true, data: invoice };
  } catch (error) {
    return handleActionError(error, 'Failed to fetch invoice');
  }
}

/**
 * Retrieves statistics about invoices, such as counts for different statuses.
 * Can be filtered by a date range.
 * @param dateFilter - An optional object with startDate and endDate to filter the statistics.
 * @returns A promise that resolves to an `ActionResult` containing the invoice statistics.
 *
 */
export async function getInvoiceStatistics(dateFilter?: {
  startDate?: Date;
  endDate?: Date;
}): Promise<ActionResult<InvoiceStatistics>> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    const stats = await invoiceRepo.getStatistics(dateFilter);
    return { success: true, data: stats };
  } catch (error) {
    return handleActionError(error, 'Failed to fetch statistics');
  }
}

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
    return handleActionError(error, 'Failed to record payment');
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

export async function bulkUpdateInvoiceStatus(
  ids: string[],
  status: InvoiceStatus,
): Promise<ActionResult<{ count: number }>> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    await invoiceRepo.bulkUpdateStatus(ids, status);
    revalidatePath('/finances/invoices');

    return { success: true, data: { count: ids.length } };
  } catch (error) {
    return handleActionError(error, 'Failed to update invoices');
  }
}

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
 * Retrieves the URL for the invoice PDF.
 * If the PDF exists in S3, it returns a signed URL.
 * If not, it generates the PDF, uploads it to S3, and then returns the signed URL.
 * @param id - The ID of the invoice.
 * @returns A promise that resolves to an `ActionResult` containing the PDF URL.
 */
export async function getInvoicePdfUrl(id: string): Promise<ActionResult<{ url: string }>> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    const invoice = await invoiceRepo.findByIdWithDetails(id);
    if (!invoice) {
      return { success: false, error: 'Invoice not found' };
    }

    // Generate or retrieve PDF using centralized service
    // Note: skipDownload=true since we only need the URL, not the buffer
    const { getOrGenerateInvoicePdf } = await import('@/features/finances/invoices/services/invoice-pdf.service');
    const result = await getOrGenerateInvoicePdf(invoice, {
      context: 'getInvoicePdfUrl',
      skipDownload: true,
    });
    
    const { pdfUrl } = result;

    return { success: true, data: { url: pdfUrl } };
  } catch (error) {
    return handleActionError(error, 'Failed to get invoice PDF URL');
  }
}

/**
 * Retrieves the URL for the receipt PDF.
 * If the PDF exists in S3, it returns a signed URL.
 * If not, it generates the PDF, uploads it to S3, and then returns the signed URL.
 * @param id - The ID of the invoice.
 * @returns A promise that resolves to an `ActionResult` containing the PDF URL.
 */
export async function getReceiptPdfUrl(id: string): Promise<ActionResult<{ url: string }>> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    const invoice = await invoiceRepo.findByIdWithDetails(id);
    if (!invoice) {
      return { success: false, error: 'Invoice not found' };
    }

    // Generate or retrieve PDF using centralized service
    // Note: skipDownload=true since we only need the URL, not the buffer
    const { getOrGenerateReceiptPdf } = await import('@/features/finances/invoices/services/invoice-pdf.service');
    const result = await getOrGenerateReceiptPdf(invoice, {
      context: 'getReceiptPdfUrl',
      skipDownload: true,
    });

    const { pdfUrl } = result;

    return { success: true, data: { url: pdfUrl } };
  } catch (error) {
    return handleActionError(error, 'Failed to get receipt PDF URL');
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
