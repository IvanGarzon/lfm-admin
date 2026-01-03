'use server';

import { auth } from '@/auth';
import { SearchParams } from 'nuqs/server';
import { QuoteRepository } from '@/repositories/quote-repository';
import { QuoteStatus } from '@/prisma/client';
import { prisma } from '@/lib/prisma';
import { handleActionError } from '@/lib/error-handler';
import { requirePermission } from '@/lib/permissions';
import { searchParamsCache } from '@/filters/quotes/quotes-filters';
import type {
  QuoteStatistics,
  QuoteWithDetails,
  QuotePagination,
  QuoteItemAttachment,
  QuoteValueTrend,
  TopCustomerByQuotedValue,
  ConversionFunnelData,
  AverageTimeToDecision,
  StatsDateFilter,
} from '@/features/finances/quotes/types';
import type { ActionResult } from '@/types/actions';
import { getSignedDownloadUrl } from '@/lib/s3';

const quoteRepo = new QuoteRepository(prisma);

/**
 * Retrieves a paginated list of quotes based on specified search and filter criteria.
 * @param searchParams - The search parameters for filtering, sorting, and pagination.
 * @returns A promise that resolves to an `ActionResult` containing the paginated quote data.
 * @throws Will throw an error if the user is not authenticated or if the search parameters are invalid.
 */
export async function getQuotes(
  searchParams: SearchParams,
): Promise<ActionResult<QuotePagination>> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    requirePermission(session.user, 'canReadQuotes');

    const filters = searchParamsCache.parse(searchParams);
    const result = await quoteRepo.searchAndPaginate(filters);

    return { success: true, data: result };
  } catch (error) {
    return handleActionError(error, 'Failed to fetch quotes');
  }
}

/**
 * Retrieves a single quote by its unique identifier, including associated details.
 * @param id - The ID of the quote to retrieve.
 * @returns A promise that resolves to an `ActionResult` containing the quote details,
 * or an error if the quote is not found.
 */
export async function getQuoteById(id: string): Promise<ActionResult<QuoteWithDetails>> {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: 'Unauthorized' };
    }

    requirePermission(session.user, 'canReadQuotes');
    const quote = await quoteRepo.findByIdWithDetails(id);

    if (!quote) {
      return { success: false, error: 'Quote not found' };
    }

    return { success: true, data: quote };
  } catch (error) {
    return handleActionError(error, 'Failed to fetch quote');
  }
}

/**
 * Retrieves statistics about quotes, such as counts for different statuses.
 * Can be filtered by a date range.
 * @param dateFilter - An optional object with startDate and endDate to filter the statistics.
 * @returns A promise that resolves to an `ActionResult` containing the quote statistics.
 */
export async function getQuoteStatistics(dateFilter?: {
  startDate?: Date;
  endDate?: Date;
}): Promise<ActionResult<QuoteStatistics>> {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: 'Unauthorized' };
    }

    requirePermission(session.user, 'canReadQuotes');

    const stats = await quoteRepo.getStatistics(dateFilter);
    return { success: true, data: stats };
  } catch (error) {
    return handleActionError(error, 'Failed to fetch statistics');
  }
}

/**
 * Retrieves all attachments associated with a specific quote item.
 * @param quoteItemId - The ID of the quote item.
 * @returns A promise that resolves to an `ActionResult` containing an array of quote item attachments.
 */
export async function getQuoteItemAttachments(
  quoteItemId: string,
): Promise<ActionResult<QuoteItemAttachment[]>> {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: 'Unauthorized' };
    }

    requirePermission(session.user, 'canReadQuotes');

    const attachments = await quoteRepo.getQuoteItemAttachments(quoteItemId);

    return {
      success: true,
      data: attachments.map((attachment) => ({
        id: attachment.id,
        quoteItemId: attachment.quoteItemId,
        fileName: attachment.fileName,
        fileSize: attachment.fileSize,
        mimeType: attachment.mimeType,
        s3Key: attachment.s3Key,
        s3Url: attachment.s3Url,
        uploadedBy: attachment.uploadedBy,
        uploadedAt: attachment.uploadedAt,
      })),
    };
  } catch (error) {
    return handleActionError(error, 'Failed to fetch item attachments');
  }
}

/**
 * Generates a temporary, signed URL for downloading a quote item attachment from S3.
 * @param attachmentId - The ID of the item attachment.
 * @returns A promise that resolves to an `ActionResult` containing the signed URL and the original file name,
 * or an error if the attachment is not found.
 */
export async function getItemAttachmentDownloadUrl(
  attachmentId: string,
): Promise<ActionResult<{ url: string; fileName: string }>> {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: 'Unauthorized' };
    }

    requirePermission(session.user, 'canReadQuotes');

    // Get attachment details
    const attachment = await quoteRepo.getItemAttachmentById(attachmentId);
    if (!attachment) {
      return { success: false, error: 'Attachment not found' };
    }

    // Generate signed URL with filename to force download
    const url = await getSignedDownloadUrl(attachment.s3Key, 24 * 60 * 60, attachment.fileName);

    return {
      success: true,
      data: {
        url,
        fileName: attachment.fileName,
      },
    };
  } catch (error) {
    return handleActionError(error, 'Failed to generate download URL');
  }
}

/**
 * Gets all versions of a quote.
 * @param quoteId - The ID of any quote in the version chain.
 * @returns A promise that resolves to an `ActionResult` with all versions.
 */
export async function getQuoteVersions(quoteId: string): Promise<
  ActionResult<
    {
      id: string;
      quoteNumber: string;
      versionNumber: number;
      status: QuoteStatus;
      amount: number;
      issuedDate: Date;
      createdAt: Date;
      updatedAt: Date;
    }[]
  >
> {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: 'Unauthorized' };
    }

    requirePermission(session.user, 'canReadQuotes');

    const versions = await quoteRepo.getQuoteVersions(quoteId);

    // Convert Decimal to number
    const normalizedVersions = versions.map((v) => ({
      ...v,
      amount: Number(v.amount),
    }));

    return { success: true, data: normalizedVersions };
  } catch (error) {
    return handleActionError(error, 'Failed to fetch quote versions');
  }
}

/**
 * Get or generate a quote PDF and return the signed download URL.
 * @param id - The ID of the quote.
 * @returns A promise that resolves to an `ActionResult` containing the PDF URL and filename.
 */
export async function getQuotePdfUrl(
  id: string,
): Promise<ActionResult<{ url: string; filename: string }>> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    requirePermission(session.user, 'canReadQuotes');

    const quote = await quoteRepo.findByIdWithDetails(id);
    if (!quote) {
      return { success: false, error: 'Quote not found' };
    }

    // Generate or retrieve PDF using centralized service
    // Note: skipDownload=true since we only need the URL, not the buffer
    const { getOrGenerateQuotePdf } =
      await import('@/features/finances/quotes/services/quote-pdf.service');
    const result = await getOrGenerateQuotePdf(quote, {
      context: 'getQuotePdfUrl',
      skipDownload: true,
    });

    const { pdfUrl, pdfFilename } = result;

    return { success: true, data: { url: pdfUrl, filename: pdfFilename } };
  } catch (error) {
    return handleActionError(error, 'Failed to get quote PDF URL');
  }
}

/**
 * Retrieves monthly quote value trend data for visualization.
 * @param limit - Number of months to retrieve. Defaults to 12.
 * @returns A promise that resolves to an `ActionResult` containing the monthly quote value trends.
 */
export async function getMonthlyQuoteValueTrend(
  limit?: number,
): Promise<ActionResult<QuoteValueTrend[]>> {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: 'Unauthorized' };
    }

    requirePermission(session.user, 'canReadQuotes');

    const trend = await quoteRepo.getMonthlyQuoteValueTrend(limit);
    return { success: true, data: trend };
  } catch (error) {
    return handleActionError(error, 'Failed to fetch quote value trend');
  }
}

/**
 * Retrieves conversion funnel data showing the flow from sent to converted quotes.
 * @param dateFilter - Optional date range filter.
 * @returns A promise that resolves to an `ActionResult` containing the conversion funnel data.
 */
export async function getConversionFunnel(
  dateFilter?: StatsDateFilter,
): Promise<ActionResult<ConversionFunnelData>> {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: 'Unauthorized' };
    }

    requirePermission(session.user, 'canReadQuotes');

    const funnel = await quoteRepo.getConversionFunnel(dateFilter);
    return { success: true, data: funnel };
  } catch (error) {
    return handleActionError(error, 'Failed to fetch conversion funnel');
  }
}

/**
 * Retrieves top customers by total quoted value with conversion metrics.
 * @param limit - Number of customers to retrieve. Defaults to 5.
 * @returns A promise that resolves to an `ActionResult` containing the top customers.
 */
export async function getTopCustomersByQuotedValue(
  limit?: number,
): Promise<ActionResult<TopCustomerByQuotedValue[]>> {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: 'Unauthorized' };
    }

    requirePermission(session.user, 'canReadQuotes');

    const topCustomers = await quoteRepo.getTopCustomersByQuotedValue(limit);
    return { success: true, data: topCustomers };
  } catch (error) {
    return handleActionError(error, 'Failed to fetch top customers');
  }
}

/**
 * Retrieves average time to decision metrics for quotes.
 * @returns A promise that resolves to an `ActionResult` containing average time to decision data.
 */
export async function getAverageTimeToDecision(): Promise<ActionResult<AverageTimeToDecision>> {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: 'Unauthorized' };
    }

    requirePermission(session.user, 'canReadQuotes');

    const avgTime = await quoteRepo.getAverageTimeToDecision();
    return { success: true, data: avgTime };
  } catch (error) {
    return handleActionError(error, 'Failed to fetch average time to decision');
  }
}
