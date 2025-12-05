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
  MarkInvoiceAsPaidSchema,
  MarkInvoiceAsPendingSchema,
  CancelInvoiceSchema,
  InvoiceFiltersSchema,
  SendInvoiceEmailSchema,
  SendReminderEmailSchema,
  SendReceiptEmailSchema,
  type CreateInvoiceInput,
  type UpdateInvoiceInput,
  type MarkInvoiceAsPaidInput,
  type MarkInvoiceAsPendingInput,
  type CancelInvoiceInput,
  type SendInvoiceEmailInput,
  type SendReminderEmailInput,
  type SendReceiptEmailInput,
} from '@/schemas/invoices';
import type {
  InvoiceFilters,
  InvoiceStatistics,
  InvoiceWithDetails,
  InvoicePagination,
} from '@/features/finances/invoices/types';
import type { ActionResult } from '@/types/actions';

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
    const validatedData = CreateInvoiceSchema.parse(data);
    const invoice = await invoiceRepo.createInvoiceWithItems(validatedData);

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
    const invoice = await invoiceRepo.markAsPending(validatedInvoice.id);

    if (!invoice) {
      return { success: false, error: 'Invoice not found' };
    }

    // Generate or retrieve PDF using DocumentService
    const { getOrGenerateInvoicePdf } = await import('@/features/finances/invoices/services/invoice-pdf.service');
    const result = await getOrGenerateInvoicePdf(invoice, {
      context: 'markInvoiceAsPending',
      skipDownload: false,
    });
    const { pdfBuffer, pdfUrl, pdfFilename } = result;

    const validatedInvoiceEmailSchema: SendInvoiceEmailInput = SendInvoiceEmailSchema.parse({
      invoiceId: invoice.id,
      to: invoice.customer.email,
      invoiceData: {
        invoiceNumber: invoice.invoiceNumber,
        customerName: `${invoice.customer.firstName} ${invoice.customer.lastName}`,
        amount: invoice.amount,
        currency: invoice.currency,
        dueDate: invoice.dueDate,
        issuedDate: invoice.issuedDate,
      },
      pdfUrl,
    });

    // Send invoice email with PDF link and attachment in background
    const { sendEmailNotification } = await import('@/lib/email-service');

    sendEmailNotification({ 
      to: validatedInvoiceEmailSchema.to,
      subject: `Invoice ${validatedInvoiceEmailSchema.invoiceData.invoiceNumber}`,
      template: 'invoice',
      props: {
        invoiceData: {
          ...validatedInvoiceEmailSchema.invoiceData,
        },
        pdfUrl,
      },
      ...(pdfBuffer
        ? {
            attachments: [
              {
                filename: pdfFilename,
                content: pdfBuffer,
              },
            ],
          }
        : {}
      ),
    });

    logger.info('Invoice email sent successfully with PDF attachment', {
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
 * Marks an invoice as paid.
 * @param data - An object containing the invoice ID, the paid date, and the payment method.
 * @returns A promise that resolves to an `ActionResult` with the invoice's ID upon success,
 * or an error if the invoice is not found.
 */
export async function markInvoiceAsPaid(
  data: MarkInvoiceAsPaidInput,
): Promise<ActionResult<{ id: string }>> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    const validatedData = MarkInvoiceAsPaidSchema.parse(data);

    const invoice = await invoiceRepo.markAsPaid(
      validatedData.id,
      validatedData.paidDate,
      validatedData.paymentMethod,
    );

    if (!invoice) {
      return { success: false, error: 'Invoice not found' };
    }

    revalidatePath('/finances/invoices');
    revalidatePath(`/finances/invoices/${validatedData.id}`);

    return { success: true, data: { id: invoice.id } };
  } catch (error) {
    return handleActionError(error, 'Failed to mark invoice as paid');
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
  try {
    const validatedData = CancelInvoiceSchema.parse(data);

    const invoice = await invoiceRepo.cancel(
      validatedData.id,
      validatedData.cancelledDate,
      validatedData.cancelReason,
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
      const { generateReceiptNumber } = await import('@/features/finances/invoices/utils/invoice-helpers');
      const receiptNumber = await generateReceiptNumber();
      
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

    // Generate or retrieve PDF using centralized service
    const { getOrGenerateReceiptPdf } = await import('@/features/finances/invoices/services/invoice-pdf.service');
    const result = await getOrGenerateReceiptPdf(invoice, {
      context: 'sendInvoiceReceipt',
      skipDownload: false,
    });
    
    const { pdfBuffer, pdfFilename } = result;

    const validatedReceiptEmailSchem: SendReceiptEmailInput = SendReceiptEmailSchema.parse({
      invoiceId: invoice.id,
      to: invoice.customer.email,
      receiptData: {
        invoiceNumber: invoice.invoiceNumber,
        receiptNumber: invoice.receiptNumber,
        customerName: `${invoice.customer.firstName} ${invoice.customer.lastName}`,
        amount: invoice.amount,
        currency: invoice.currency,
        paidDate: invoice.paidDate || new Date(),
        paymentMethod: invoice.paymentMethod || 'Not specified',
      },
    });

    // Send receipt email with PDF attachment
    const { sendEmailNotification } = await import('@/lib/email-service');

    await sendEmailNotification({
      to: validatedReceiptEmailSchem.to,
      subject: `Payment Receipt ${validatedReceiptEmailSchem.receiptData.receiptNumber || validatedReceiptEmailSchem.receiptData.invoiceNumber}`,
      template: 'receipt',
      props: {
        receiptData: {
          ...validatedReceiptEmailSchem.receiptData,
        },
      },
      ...(pdfBuffer
        ? {
            attachments: [
              {
                filename: pdfFilename,
                content: pdfBuffer,
              },
            ],
          }
        : {}
      ),
    });

    logger.info('Receipt email sent successfully with PDF attachment', {
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
 * Sends a reminder for an invoice.
 * @param id - The ID of the invoice to send a reminder for.
 * @returns A promise that resolves to an `ActionResult` with the invoice's ID upon success,
 * or an error if the invoice is not found.
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

    // Generate or retrieve PDF using centralized service
    const { getOrGenerateInvoicePdf } = await import('@/features/finances/invoices/services/invoice-pdf.service');
    const result = await getOrGenerateInvoicePdf(invoice, {
      context: 'sendInvoiceReminder',
      skipDownload: false, // Need buffer for email attachment
    });
    const { pdfBuffer, pdfUrl, pdfFilename } = result;

    // Note: Document creation/update is handled inside getOrGenerateInvoicePdf via DocumentService

    const validatedReminderEmailSchema: SendReminderEmailInput = SendReminderEmailSchema.parse({
      invoiceId: invoice.id,
      to: invoice.customer.email,
      reminderData: {
        invoiceNumber: invoice.invoiceNumber,
        customerName: `${invoice.customer.firstName} ${invoice.customer.lastName}`,
        amount: invoice.amount,
        currency: invoice.currency,
        dueDate: invoice.dueDate,
        daysOverdue,
      },
      pdfUrl,
    });

    // Send reminder email with PDF attachment and link
    const { sendEmailNotification } = await import('@/lib/email-service');

    await sendEmailNotification({
      to: validatedReminderEmailSchema.to,
      subject: `Payment Reminder: Invoice ${validatedReminderEmailSchema.reminderData.invoiceNumber} - ${validatedReminderEmailSchema.reminderData.daysOverdue} Days Overdue`,
      template: 'reminder',
      props: {
        reminderData: {
          ...validatedReminderEmailSchema.reminderData,
        },
        pdfUrl: validatedReminderEmailSchema.pdfUrl,
      },
      ...(pdfBuffer
        ? {
            attachments: [
              {
                filename: pdfFilename,
                content: pdfBuffer,
              },
            ],
          }
        : {}
      ),
    });

    const updatedInvoice = await invoiceRepo.incrementReminderCount(id);
    if (!updatedInvoice) {
      return { success: false, error: 'Failed to update reminder count' };
    }

    logger.info('Reminder email sent successfully with PDF attachment', {
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
 * The invoice is not permanently removed from the database.
 * @param id - The ID of the invoice to delete.
 * @returns A promise that resolves to an `ActionResult` with the ID of the soft-deleted invoice,
 * or an error if the invoice is not found.
 */
export async function deleteInvoice(id: string): Promise<ActionResult<{ id: string }>> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
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
