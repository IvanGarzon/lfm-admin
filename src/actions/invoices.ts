'use server';

import { ZodError } from 'zod';
import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';
import { SearchParams } from 'nuqs/server';
import { InvoiceRepository } from '@/repositories/invoice-repository';
import { Prisma } from '@/prisma/client';
import { prisma } from '@/lib/prisma';
import {
  CreateInvoiceSchema,
  UpdateInvoiceSchema,
  MarkInvoiceAsPaidSchema,
  MarkInvoiceAsPendingSchema,
  CancelInvoiceSchema,
  InvoiceFiltersSchema,
  type CreateInvoiceInput,
  type UpdateInvoiceInput,
  type MarkInvoiceAsPaidInput,
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
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }

    return { success: false, error: 'Failed to fetch invoices' };
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
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: 'Unauthorized' };
    }

    const invoice = await invoiceRepo.findByIdWithDetails(id);

    if (!invoice) {
      return { success: false, error: 'Invoice not found' };
    }

    return { success: true, data: invoice };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }

    return { success: false, error: 'Failed to fetch invoice' };
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
  try {
    const stats = await invoiceRepo.getStatistics(dateFilter);
    return { success: true, data: stats };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Failed to fetch statistics' };
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
    // Validate input
    const validatedData = CreateInvoiceSchema.parse(data);
    const invoice = await invoiceRepo.createInvoiceWithItems(validatedData);
    revalidatePath('/finances/invoices');

    return {
      success: true,
      data: { id: invoice.id, invoiceNumber: invoice.invoiceNumber },
    };
  } catch (error) {
    if (error instanceof ZodError) {
      return {
        success: false,
        error: 'Invalid invoice data. Please check the fields and try again.',
      };
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return { success: false, error: 'Invoice number already exists' };
      }

      if (error.code === 'P2003') {
        return { success: false, error: 'Customer not found' };
      }
    }

    if (error instanceof Error) {
      return { success: false, error: error.message };
    }

    return { success: false, error: 'Failed to create invoice' };
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
    // Validate input
    const validatedData = UpdateInvoiceSchema.parse(data);

    // Check if invoice exists
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
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2003') {
        return { success: false, error: 'Customer not found' };
      }
    }

    if (error instanceof Error) {
      return { success: false, error: error.message };
    }

    return { success: false, error: 'Failed to update invoice' };
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
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }

    return { success: false, error: 'Failed to mark invoice as paid' };
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
  try {
    const validatedData = MarkInvoiceAsPendingSchema.parse(data);

    const invoice = await invoiceRepo.markAsPending(validatedData.id);

    if (!invoice) {
      return { success: false, error: 'Invoice not found' };
    }

    revalidatePath('/finances/invoices');
    revalidatePath(`/finances/invoices/${validatedData.id}`);

    return { success: true, data: { id: invoice.id } };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }

    return { success: false, error: 'Failed to mark invoice as pending' };
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
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }

    return { success: false, error: 'Failed to cancel invoice' };
  }
}

/**
 * Sends a reminder for an invoice.
 * @param id - The ID of the invoice to send a reminder for.
 * @returns A promise that resolves to an `ActionResult` with the invoice's ID upon success,
 * or an error if the invoice is not found.
 */
export async function sendInvoiceReminder(id: string): Promise<ActionResult<{ id: string }>> {
  try {
    const invoice = await invoiceRepo.sendReminder(id);

    if (!invoice) {
      return { success: false, error: 'Invoice not found' };
    }

    revalidatePath('/finances/invoices');
    revalidatePath(`/finances/invoices/${id}`);

    return { success: true, data: { id: invoice.id } };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }

    return { success: false, error: 'Failed to send reminder' };
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
  try {
    const success = await invoiceRepo.softDelete(id);

    if (!success) {
      return { success: false, error: 'Invoice not found' };
    }

    revalidatePath('/finances/invoices');

    return { success: true, data: { id } };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }

    return { success: false, error: 'Failed to delete invoice' };
  }
}
