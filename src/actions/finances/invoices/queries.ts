'use server';

import { SearchParams } from 'nuqs/server';
import { InvoiceRepository } from '@/repositories/invoice-repository';
import { prisma } from '@/lib/prisma';
import { handleActionError } from '@/lib/error-handler';
import { withPermission } from '@/lib/action-auth';
import type {
  InvoiceStatistics,
  InvoiceWithDetails,
  InvoicePagination,
  InvoiceMetadata,
  InvoiceItemDetail,
  InvoicePaymentItem,
  InvoiceStatusHistoryItem,
  RevenueTrend,
  TopCustomerDebtor,
} from '@/features/finances/invoices/types';
import type { ActionResult } from '@/types/actions';
import { searchParamsCache } from '@/filters/invoices/invoices-filters';

const invoiceRepo = new InvoiceRepository(prisma);

/**
 * Retrieves a paginated list of invoices based on specified search and filter criteria.
 * @param searchParams - The search parameters for filtering, sorting, and pagination.
 * @returns A promise that resolves to an `ActionResult` containing the paginated invoice data.
 * @throws Will throw an error if the user is not authenticated or if the search parameters are invalid.
 *
 */
export const getInvoices = withPermission<SearchParams, InvoicePagination>(
  'canReadInvoices',
  async (session, searchParams) => {
    try {
      const filters = searchParamsCache.parse(searchParams);
      const result = await invoiceRepo.searchAndPaginate(filters);

      return { success: true, data: result };
    } catch (error) {
      return handleActionError(error, 'Failed to fetch invoices');
    }
  },
);

/**
 * Retrieves a single invoice by its unique identifier, including associated details.
 * @param id - The ID of the invoice to retrieve.
 * @returns A promise that resolves to an `ActionResult` containing the invoice details,
 * or an error if the invoice is not found.
 *
 */
export const getInvoiceById = withPermission<string, InvoiceWithDetails>(
  'canReadInvoices',
  async (session, id) => {
    try {
      const invoice = await invoiceRepo.findByIdWithDetails(id);

      if (!invoice) {
        return { success: false, error: 'Invoice not found' };
      }

      return { success: true, data: invoice };
    } catch (error) {
      return handleActionError(error, 'Failed to fetch invoice');
    }
  },
);

/**
 * Retrieves basic invoice details without relations, but with relationship counts.
 * Useful for fast initial loading.
 * @param id - The ID of the invoice to retrieve.
 * @returns A promise that resolves to an `ActionResult` containing basic invoice details.
 */
export const getInvoiceMetadata = withPermission<string, InvoiceMetadata>(
  'canReadInvoices',
  async (session, id) => {
    try {
      const invoice = await invoiceRepo.findByIdMetadata(id);

      if (!invoice) {
        return { success: false, error: 'Invoice not found' };
      }

      return { success: true, data: invoice };
    } catch (error) {
      return handleActionError(error, 'Failed to fetch basic invoice details');
    }
  },
);

/**
 * Retrieves all items for a specific invoice.
 * @param id - The ID of the invoice.
 * @returns A promise that resolves to an `ActionResult` containing the invoice items.
 */
export const getInvoiceItems = withPermission<string, InvoiceItemDetail[]>(
  'canReadInvoices',
  async (session, id) => {
    try {
      const items = await invoiceRepo.findInvoiceItems(id);
      return { success: true, data: items };
    } catch (error) {
      return handleActionError(error, 'Failed to fetch invoice items');
    }
  },
);

/**
 * Retrieves all payments for a specific invoice.
 * @param id - The ID of the invoice.
 * @returns A promise that resolves to an `ActionResult` containing the invoice payments.
 */
export const getInvoicePayments = withPermission<string, InvoicePaymentItem[]>(
  'canReadInvoices',
  async (session, id) => {
    try {
      const payments = await invoiceRepo.findInvoicePayments(id);
      return { success: true, data: payments };
    } catch (error) {
      return handleActionError(error, 'Failed to fetch invoice payments');
    }
  },
);

/**
 * Retrieves the status history for a specific invoice.
 * @param id - The ID of the invoice.
 * @returns A promise that resolves to an `ActionResult` containing the status history events.
 */
export const getInvoiceStatusHistory = withPermission<string, InvoiceStatusHistoryItem[]>(
  'canReadInvoices',
  async (session, id) => {
    try {
      const history = await invoiceRepo.findInvoiceStatusHistory(id);
      return { success: true, data: history };
    } catch (error) {
      return handleActionError(error, 'Failed to fetch invoice status history');
    }
  },
);

/**
 * Retrieves statistics about invoices, such as counts for different statuses.
 * Can be filtered by a date range.
 * @param dateFilter - An optional object with startDate and endDate to filter the statistics.
 * @returns A promise that resolves to an `ActionResult` containing the invoice statistics.
 *
 */
export const getInvoiceStatistics = withPermission<
  { startDate?: Date; endDate?: Date } | undefined,
  InvoiceStatistics
>('canReadInvoices', async (session, dateFilter) => {
  try {
    const stats = await invoiceRepo.getStatistics(dateFilter);
    return { success: true, data: stats };
  } catch (error) {
    return handleActionError(error, 'Failed to fetch statistics');
  }
});

/**
 * Retrieves the monthly revenue trend data for a specified number of months.
 * @param limit - The maximum number of months to retrieve. Defaults to 12.
 * @returns A promise that resolves to an `ActionResult` containing an array of `RevenueTrend` objects.
 */
export const getMonthlyRevenueTrend = withPermission<number | undefined, RevenueTrend[]>(
  'canReadInvoices',
  async (session, limit = 12) => {
    try {
      const trend = await invoiceRepo.getMonthlyRevenueTrend(limit);
      return { success: true, data: trend };
    } catch (error) {
      return handleActionError(error, 'Failed to fetch revenue trend');
    }
  },
);

/**
 * Retrieves a list of top customer debtors based on their outstanding balance.
 * @param limit - The maximum number of debtors to retrieve. Defaults to 5.
 * @returns A promise that resolves to an `ActionResult` containing an array of `TopCustomerDebtor` objects.
 */
export const getTopDebtors = withPermission<number | undefined, TopCustomerDebtor[]>(
  'canReadInvoices',
  async (session, limit = 5) => {
    try {
      const debtors = await invoiceRepo.getTopDebtors(limit);
      return { success: true, data: debtors };
    } catch (error) {
      return handleActionError(error, 'Failed to fetch top debtors');
    }
  },
);

/**
 * Retrieves the URL for the invoice PDF.
 * If the PDF exists in S3, it returns a signed URL.
 * If not, it generates the PDF, uploads it to S3, and then returns the signed URL.
 * @param id - The ID of the invoice.
 * @returns A promise that resolves to an `ActionResult` containing the PDF URL.
 */
export const getInvoicePdfUrl = withPermission<string, { url: string }>(
  'canReadInvoices',
  async (session, id) => {
    try {
      const invoice = await invoiceRepo.findByIdWithDetails(id);
      if (!invoice) {
        return { success: false, error: 'Invoice not found' };
      }

      // Generate or retrieve PDF using centralized service
      // Note: skipDownload=true since we only need the URL, not the buffer
      const { getOrGenerateInvoicePdf } =
        await import('@/features/finances/invoices/services/invoice-pdf.service');
      const result = await getOrGenerateInvoicePdf(invoice, {
        context: 'getInvoicePdfUrl',
        skipDownload: true,
      });

      const { pdfUrl } = result;

      return { success: true, data: { url: pdfUrl } };
    } catch (error) {
      return handleActionError(error, 'Failed to get invoice PDF URL');
    }
  },
);

/**
 * Retrieves the URL for the receipt PDF.
 * If the PDF exists in S3, it returns a signed URL.
 * If not, it generates the PDF, uploads it to S3, and then returns the signed URL.
 * @param id - The ID of the invoice.
 * @returns A promise that resolves to an `ActionResult` containing the PDF URL.
 */
export const getReceiptPdfUrl = withPermission<string, { url: string }>(
  'canReadInvoices',
  async (session, id) => {
    try {
      const invoice = await invoiceRepo.findByIdWithDetails(id);
      if (!invoice) {
        return { success: false, error: 'Invoice not found' };
      }

      // Generate or retrieve PDF using centralized service
      // Note: skipDownload=true since we only need the URL, not the buffer
      const { getOrGenerateReceiptPdf } =
        await import('@/features/finances/invoices/services/invoice-pdf.service');
      const result = await getOrGenerateReceiptPdf(invoice, {
        context: 'getReceiptPdfUrl',
        skipDownload: true,
      });

      const { pdfUrl } = result;

      return { success: true, data: { url: pdfUrl } };
    } catch (error) {
      return handleActionError(error, 'Failed to get receipt PDF URL');
    }
  },
);
