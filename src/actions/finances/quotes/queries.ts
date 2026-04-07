'use server';

import { SearchParams } from 'nuqs/server';
import { QuoteRepository } from '@/repositories/quote-repository';
import { QuoteStatus } from '@/prisma/client';
import { prisma } from '@/lib/prisma';
import { handleActionError } from '@/lib/error-handler';
import { withTenantPermission } from '@/lib/action-auth';
import { searchParamsCache } from '@/filters/quotes/quotes-filters';
import type {
  QuoteStatistics,
  QuoteStatusHistoryItem,
  QuoteWithDetails,
  QuoteMetadata,
  QuoteItem,
  QuotePagination,
  QuoteItemAttachment,
  QuoteValueTrend,
  TopCustomerByQuotedValue,
  ConversionFunnelData,
  AverageTimeToDecision,
  StatsDateFilter,
} from '@/features/finances/quotes/types';
import { getSignedDownloadUrl } from '@/lib/s3';

const quoteRepo = new QuoteRepository(prisma);

/**
 * Retrieves a paginated list of quotes based on specified search and filter criteria.
 * @param searchParams - The search parameters for filtering, sorting, and pagination.
 * @returns A promise that resolves to an `ActionResult` containing the paginated quote data.
 */
export const getQuotes = withTenantPermission<SearchParams, QuotePagination>(
  'canReadQuotes',
  async (ctx, searchParams) => {
    try {
      const filters = searchParamsCache.parse(searchParams);
      const result = await quoteRepo.searchAndPaginate(filters, ctx.tenantId);

      return { success: true, data: result };
    } catch (error) {
      return handleActionError(error, 'Failed to fetch quotes');
    }
  },
);

/**
 * Retrieves a single quote by its unique identifier, including associated details.
 * @param id - The ID of the quote to retrieve.
 * @returns A promise that resolves to an `ActionResult` containing the quote details,
 * or an error if the quote is not found.
 */
export const getQuoteById = withTenantPermission<string, QuoteWithDetails>(
  'canReadQuotes',
  async (ctx, id) => {
    try {
      const quote = await quoteRepo.findQuoteById(id, ctx.tenantId);
      if (!quote) {
        return { success: false, error: 'Quote not found' };
      }

      return { success: true, data: quote };
    } catch (error) {
      return handleActionError(error, 'Failed to fetch quote');
    }
  },
);

/**
 * Retrieves lightweight quote metadata without items.
 * Used for headers, actions, and navigation where item details aren't needed.
 * Significantly reduces data transfer compared to getQuoteById.
 * @param id - The ID of the quote to retrieve.
 * @returns A promise that resolves to an `ActionResult` containing the quote metadata,
 * or an error if the quote is not found.
 */
export const getQuoteMetadata = withTenantPermission<string, QuoteMetadata>(
  'canReadQuotes',
  async (ctx, id) => {
    try {
      const quote = await quoteRepo.findQuoteMetadata(id, ctx.tenantId);

      if (!quote) {
        return { success: false, error: 'Quote not found' };
      }

      return { success: true, data: quote };
    } catch (error) {
      return handleActionError(error, 'Failed to fetch quote metadata');
    }
  },
);

/**
 * Retrieves quote items with attachments for a specific quote.
 * Fetched separately from quote metadata for better performance.
 * @param quoteId - The ID of the quote to retrieve items for.
 * @returns A promise that resolves to an `ActionResult` containing the quote items.
 */
export const getQuoteItems = withTenantPermission<string, QuoteItem[]>(
  'canReadQuotes',
  async (ctx, quoteId) => {
    try {
      const items = await quoteRepo.findQuoteItems(quoteId);

      return { success: true, data: items };
    } catch (error) {
      return handleActionError(error, 'Failed to fetch quote items');
    }
  },
);

/**
 * Retrieves the status history for a specific quote.
 * @param id - The ID of the quote.
 * @returns A promise that resolves to an `ActionResult` containing the quote status history.
 */
export const getQuoteStatusHistory = withTenantPermission<string, QuoteStatusHistoryItem[]>(
  'canReadQuotes',
  async (ctx, id) => {
    try {
      const history = await quoteRepo.findQuoteStatusHistory(id);

      return { success: true, data: history };
    } catch (error) {
      return handleActionError(error, 'Failed to fetch quote status history');
    }
  },
);

/**
 * Retrieves statistics about quotes, such as counts for different statuses.
 * Can be filtered by a date range.
 * @param dateFilter - An optional object with startDate and endDate to filter the statistics.
 * @returns A promise that resolves to an `ActionResult` containing the quote statistics.
 */
export const getQuoteStatistics = withTenantPermission<
  { startDate?: Date; endDate?: Date } | undefined,
  QuoteStatistics
>('canReadQuotes', async (ctx, dateFilter) => {
  try {
    const stats = await quoteRepo.getQuoteStatistics(ctx.tenantId, dateFilter);
    return { success: true, data: stats };
  } catch (error) {
    return handleActionError(error, 'Failed to fetch statistics');
  }
});

/**
 * Retrieves all attachments associated with a specific quote item.
 * @param quoteItemId - The ID of the quote item.
 * @returns A promise that resolves to an `ActionResult` containing an array of quote item attachments.
 */
export const getQuoteItemAttachments = withTenantPermission<string, QuoteItemAttachment[]>(
  'canReadQuotes',
  async (ctx, quoteItemId) => {
    try {
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
  },
);

/**
 * Generates a temporary, signed URL for downloading a quote item attachment from S3.
 * @param attachmentId - The ID of the item attachment.
 * @returns A promise that resolves to an `ActionResult` containing the signed URL and the original file name,
 * or an error if the attachment is not found.
 */
export const getItemAttachmentDownloadUrl = withTenantPermission<
  string,
  { url: string; fileName: string }
>('canReadQuotes', async (ctx, attachmentId) => {
  try {
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
});

/**
 * Gets all versions of a quote.
 * @param quoteId - The ID of any quote in the version chain.
 * @returns A promise that resolves to an `ActionResult` with all versions.
 */
export const getQuoteVersions = withTenantPermission<
  string,
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
>('canReadQuotes', async (ctx, quoteId) => {
  try {
    const versions = await quoteRepo.getQuoteVersions(quoteId);

    const normalizedVersions = versions.map((v) => ({
      ...v,
      amount: Number(v.amount),
    }));

    return { success: true, data: normalizedVersions };
  } catch (error) {
    return handleActionError(error, 'Failed to fetch quote versions');
  }
});

/**
 * Get or generate a quote PDF and return the signed download URL.
 * @param id - The ID of the quote.
 * @returns A promise that resolves to an `ActionResult` containing the PDF URL and filename.
 */
export const getQuotePdfUrl = withTenantPermission<string, { url: string; filename: string }>(
  'canReadQuotes',
  async (ctx, id) => {
    try {
      const quote = await quoteRepo.findQuoteById(id, ctx.tenantId);
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
  },
);

/**
 * Retrieves monthly quote value trend data for visualization.
 * @param limit - Number of months to retrieve. Defaults to 12.
 * @returns A promise that resolves to an `ActionResult` containing the monthly quote value trends.
 */
export const getMonthlyQuoteValueTrend = withTenantPermission<
  number | undefined,
  QuoteValueTrend[]
>('canReadQuotes', async (ctx, limit) => {
  try {
    const trend = await quoteRepo.getMonthlyQuoteValueTrend(limit, ctx.tenantId);
    return { success: true, data: trend };
  } catch (error) {
    return handleActionError(error, 'Failed to fetch quote value trend');
  }
});

/**
 * Retrieves conversion funnel data showing the flow from sent to converted quotes.
 * @param dateFilter - Optional date range filter.
 * @returns A promise that resolves to an `ActionResult` containing the conversion funnel data.
 */
export const getConversionFunnel = withTenantPermission<
  StatsDateFilter | undefined,
  ConversionFunnelData
>('canReadQuotes', async (ctx, dateFilter) => {
  try {
    const funnel = await quoteRepo.getConversionFunnel(ctx.tenantId, dateFilter);
    return { success: true, data: funnel };
  } catch (error) {
    return handleActionError(error, 'Failed to fetch conversion funnel');
  }
});

/**
 * Retrieves top customers by total quoted value with conversion metrics.
 * @param limit - Number of customers to retrieve. Defaults to 5.
 * @returns A promise that resolves to an `ActionResult` containing the top customers.
 */
export const getTopCustomersByQuotedValue = withTenantPermission<
  number | undefined,
  TopCustomerByQuotedValue[]
>('canReadQuotes', async (ctx, limit) => {
  try {
    const topCustomers = await quoteRepo.getTopCustomersByQuotedValue(limit, ctx.tenantId);
    return { success: true, data: topCustomers };
  } catch (error) {
    return handleActionError(error, 'Failed to fetch top customers');
  }
});

/**
 * Retrieves average time to decision metrics for quotes.
 * @returns A promise that resolves to an `ActionResult` containing average time to decision data.
 */
export const getAverageTimeToDecision = withTenantPermission<void, AverageTimeToDecision>(
  'canReadQuotes',
  async (session) => {
    try {
      const avgTime = await quoteRepo.getAverageTimeToDecision(ctx.tenantId);
      return { success: true, data: avgTime };
    } catch (error) {
      return handleActionError(error, 'Failed to fetch average time to decision');
    }
  },
);
