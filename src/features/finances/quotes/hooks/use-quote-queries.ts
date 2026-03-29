import { QuoteStatus } from '@/prisma/client';
import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
  skipToken,
  type QueryClient,
} from '@tanstack/react-query';
import {
  getQuotes,
  getQuoteById,
  getQuoteMetadata,
  getQuoteItems,
  getQuoteStatusHistory,
  getQuoteStatistics,
  getQuoteVersions,
  getQuotePdfUrl,
  getQuoteItemAttachments,
  getItemAttachmentDownloadUrl,
  getMonthlyQuoteValueTrend,
  getConversionFunnel,
  getTopCustomersByQuotedValue,
  getAverageTimeToDecision,
} from '@/actions/finances/quotes/queries';
import {
  createQuote,
  updateQuote,
  markQuoteAsAccepted,
  markQuoteAsRejected,
  markQuoteAsSent,
  markQuoteAsOnHold,
  markQuoteAsCancelled,
  convertQuoteToInvoice,
  checkAndExpireQuotes,
  bulkUpdateQuoteStatus,
  bulkDeleteQuotes,
  deleteQuote,
  uploadQuoteItemAttachment,
  deleteQuoteItemAttachment,
  updateQuoteItemNotes,
  updateQuoteItemColors,
  createQuoteVersion,
  duplicateQuote,
  sendQuoteEmail,
  sendQuoteFollowUp,
  toggleQuoteFavourite,
} from '@/actions/finances/quotes/mutations';

import type {
  QuoteFilters,
  QuoteMetadata,
  QuoteItem,
  MarkQuoteAsAcceptedData,
  MarkQuoteAsRejectedData,
  MarkQuoteAsOnHoldData,
  MarkQuoteAsCancelledData,
  ConvertQuoteToInvoiceData,
} from '@/features/finances/quotes/types';
import { formatDateNormalizer } from '@/lib/utils';

import type { CreateQuoteInput, UpdateQuoteInput } from '@/schemas/quotes';
import { toast } from 'sonner';

// -- QUERY KEYS -------------------------------------------------------------

/**
 * Query key factory for quote-related queries.
 * Provides type-safe, hierarchical query keys for React Query cache management.
 */
export const QUOTE_KEYS = {
  all: ['quotes'] as const,
  lists: () => [...QUOTE_KEYS.all, 'list'] as const,
  list: (filters: QuoteFilters) => [...QUOTE_KEYS.lists(), { filters }] as const,
  details: () => [...QUOTE_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...QUOTE_KEYS.details(), id] as const,
  metadata: (id: string) => [...QUOTE_KEYS.all, 'metadata', id] as const,
  items: (quoteId: string) => [...QUOTE_KEYS.all, 'items', quoteId] as const,
  history: (id: string) => [...QUOTE_KEYS.detail(id), 'history'] as const,
  statistics: () => [...QUOTE_KEYS.all, 'statistics'] as const,
  itemAttachments: (quoteItemId: string) =>
    [...QUOTE_KEYS.all, 'item-attachments', quoteItemId] as const,
  versions: (quoteId: string) => [...QUOTE_KEYS.detail(quoteId), 'versions'] as const,
  analytics: {
    all: () => [...QUOTE_KEYS.all, 'analytics'] as const,
    valueTrend: (limit?: number) => [...QUOTE_KEYS.analytics.all(), 'value-trend', limit] as const,
    conversionFunnel: (dateFilter?: {
      startDate?: Date | string | null;
      endDate?: Date | string | null;
    }) => [...QUOTE_KEYS.analytics.all(), 'conversion-funnel', dateFilter] as const,
    topCustomers: (limit?: number) =>
      [...QUOTE_KEYS.analytics.all(), 'top-customers', limit] as const,
    avgTimeToDecision: () => [...QUOTE_KEYS.analytics.all(), 'avg-time-to-decision'] as const,
  },
};

// -- HELPER FUNCTIONS -------------------------------------------------------

/**
 * Invalidates quote-related queries after mutations.
 * Ensures cache consistency across quote lists, details, metadata, items, and statistics.
 *
 * @param queryClient - The React Query client instance
 * @param options - Optional configuration for targeted invalidation
 * @param options.quoteId - Specific quote ID to invalidate (invalidates detail, metadata, and items)
 * @param options.invalidateAllDetails - Whether to invalidate all detail queries
 * @param options.includeInvoices - Whether to also invalidate invoice queries (used when converting quotes)
 */
function invalidateQuoteQueries(
  queryClient: QueryClient,
  options?: {
    quoteId?: string;
    invalidateAllDetails?: boolean;
    includeInvoices?: boolean;
  },
) {
  if (options?.quoteId) {
    queryClient.invalidateQueries({ queryKey: QUOTE_KEYS.detail(options.quoteId) });
    queryClient.invalidateQueries({ queryKey: QUOTE_KEYS.metadata(options.quoteId) });
    queryClient.invalidateQueries({ queryKey: QUOTE_KEYS.items(options.quoteId) });
  }

  if (options?.invalidateAllDetails) {
    queryClient.invalidateQueries({ queryKey: QUOTE_KEYS.details() });
  }

  queryClient.invalidateQueries({ queryKey: QUOTE_KEYS.lists() });
  queryClient.invalidateQueries({ queryKey: QUOTE_KEYS.statistics() });

  if (options?.includeInvoices) {
    queryClient.invalidateQueries({ queryKey: ['invoices'] });
  }
}

// -- QUERY HOOKS (Data Fetching) --------------------------------------------

/**
 * Fetches a paginated, filtered list of quotes.
 *
 * @param filters - Filter criteria including search term and status filters
 * @returns Query result containing the filtered quote list
 *
 * Cache behaviour:
 * - Data is cached for 30 seconds to prevent excessive refetching
 * - Query automatically refetches when filters change
 * - Cache is invalidated when quotes are created, updated, or deleted
 */
export function useQuotes(filters: QuoteFilters) {
  return useQuery({
    queryKey: QUOTE_KEYS.list(filters),
    queryFn: async () => {
      const searchParams: Record<string, string | string[]> = {};

      if (filters.search) {
        searchParams.search = filters.search;
      }

      if (filters.status && filters.status.length > 0) {
        searchParams.status = filters.status;
      }

      const result = await getQuotes(searchParams);
      if (!result.success) {
        throw new Error(result.error);
      }

      return result.data;
    },
    staleTime: 30 * 1000,
  });
}

/**
 * Fetches complete details for a single quote, including all items and attachments.
 * For better performance when items aren't needed, consider using useQuoteMetadata instead.
 *
 * @param id - The quote ID to fetch
 * @param options - Query options
 * @param options.enabled - Whether the query should run automatically
 * @returns Query result containing the complete quote with details
 */
export function useQuote(id: string | undefined, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: QUOTE_KEYS.detail(id ?? ''), // Keep for type safety
    queryFn: id
      ? async () => {
          const result = await getQuoteById(id);
          if (!result.success) {
            throw new Error(result.error);
          }

          return result.data;
        }
      : skipToken,
    enabled: options?.enabled,
    staleTime: 30 * 1000,
  });
}

/**
 * Fetches lightweight quote metadata without items.
 * Used for headers, actions, and navigation where item details aren't needed.
 * Significantly reduces data transfer compared to useQuote.
 *
 * @param id - The quote ID to fetch metadata for
 * @returns Query result containing quote metadata without items
 */
export function useQuoteMetadata(id: string | undefined) {
  return useQuery({
    queryKey: QUOTE_KEYS.metadata(id ?? ''), // Keep for type safety
    queryFn: id
      ? async () => {
          const result = await getQuoteMetadata(id);
          if (!result.success) {
            throw new Error(result.error);
          }

          return result.data;
        }
      : skipToken,
    staleTime: 30 * 1000,
  });
}

/**
 * Fetches quote items with attachments for a specific quote.
 * Fetched separately from quote metadata for better performance and caching.
 * Allows lazy-loading of items when viewing quote details.
 *
 * @param quoteId - The quote ID to fetch items for
 * @param options - Query options
 * @param options.enabled - Whether the query should run automatically
 * @returns Query result containing quote items with attachments
 */
export function useQuoteItems(quoteId: string | undefined, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: QUOTE_KEYS.items(quoteId ?? ''), // Keep for type safety
    queryFn: quoteId
      ? async () => {
          const result = await getQuoteItems(quoteId);
          if (!result.success) {
            throw new Error(result.error);
          }

          return result.data;
        }
      : skipToken,
    enabled: options?.enabled,
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Returns a function to prefetch quote data for optimistic loading.
 * Useful for hover interactions or when navigating to quote details.
 *
 * @returns Function that accepts a quote ID and prefetches its data
 */
export function usePrefetchQuote() {
  const queryClient = useQueryClient();

  return (quoteId: string) => {
    queryClient.prefetchQuery({
      queryKey: QUOTE_KEYS.detail(quoteId),
      queryFn: async () => {
        const result = await getQuoteById(quoteId);
        if (!result.success) {
          throw new Error(result.error);
        }

        return result.data;
      },
      staleTime: 30 * 1000,
    });
  };
}

/**
 * Fetches all versions of a quote.
 * Used for version history and comparing changes across quote revisions.
 *
 * @param quoteId - The quote ID to fetch versions for
 * @param options - Query options
 * @param options.enabled - Whether the query should run automatically
 * @returns Query result containing all quote versions
 */
export function useQuoteVersions(quoteId: string | undefined, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: QUOTE_KEYS.versions(quoteId ?? ''), // Keep for type safety
    queryFn: quoteId
      ? async () => {
          const result = await getQuoteVersions(quoteId);
          if (!result.success) {
            throw new Error(result.error);
          }

          return result.data;
        }
      : skipToken,
    enabled: options?.enabled,
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Fetches the status change history for a quote.
 * Provides audit trail of all status transitions with timestamps and reasons.
 *
 * @param id - The quote ID to fetch history for
 * @param options - Query options
 * @param options.enabled - Whether the query should run automatically
 * @returns Query result containing chronological status history
 */
export function useQuoteHistory(id: string | undefined, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: QUOTE_KEYS.history(id ?? ''), // Keep for type safety
    queryFn: id
      ? async () => {
          const result = await getQuoteStatusHistory(id);
          if (!result.success) {
            throw new Error(result.error);
          }

          return result.data;
        }
      : skipToken,
    enabled: options?.enabled,
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Fetches aggregated quote statistics with optional date filtering.
 * Provides overview metrics including total value, conversion rates, and status breakdown.
 * Uses placeholder data to prevent layout shifts when date filter changes.
 *
 * @param dateFilter - Optional date range filter
 * @param dateFilter.startDate - Start date for filtering statistics
 * @param dateFilter.endDate - End date for filtering statistics
 * @returns Query result containing aggregated quote statistics
 */
export function useQuoteStatistics(dateFilter?: { startDate?: Date; endDate?: Date }) {
  // Normalize date filter to ISO date strings for stable query keys
  // This prevents cache misses when component remounts with logically identical dates
  const normalizedDateFilter = dateFilter
    ? {
        startDate: dateFilter.startDate ? formatDateNormalizer(dateFilter.startDate) : null,
        endDate: dateFilter.endDate ? formatDateNormalizer(dateFilter.endDate) : null,
      }
    : undefined;

  return useQuery({
    queryKey: [...QUOTE_KEYS.statistics(), normalizedDateFilter],
    queryFn: async () => {
      const result = await getQuoteStatistics(dateFilter);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    staleTime: 60_000, // 1 minute
    placeholderData: keepPreviousData,
  });
}

// -- MUTATION HOOKS (Create/Update) -----------------------------------------

/**
 * Creates a new quote with items.
 * Invalidates quote lists and statistics after successful creation.
 *
 * @returns Mutation hook for creating quotes
 *
 * @example
 * const { mutate: createQuote } = useCreateQuote();
 * createQuote({
 *   customerId: 'customer-123',
 *   items: [
 *     {
 *       description: 'Product 1',
 *       quantity: 2,
 *       unitPrice: 100,
 *     },
 *   ],
 * });
 *
 * Cache behavior:
 * - Cancels outgoing list queries to prevent race conditions
 * - Invalidates quote lists and statistics on success
 *
 * Toast notifications:
 * - Success: "Quote QUO-001 created successfully" (with quote number)
 * - Error: "Failed to create quote"
 */
export function useCreateQuote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateQuoteInput) => {
      const result = await createQuote(data);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onMutate: async () => {
      // Cancel any outgoing refetches to prevent race conditions
      await queryClient.cancelQueries({ queryKey: QUOTE_KEYS.lists() });
    },
    onSuccess: (data) => {
      invalidateQuoteQueries(queryClient);
      toast.success(`Quote ${data.quoteNumber} created successfully`);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create quote');
    },
  });
}

/**
 * Updates an existing quote's details and items.
 * Implements optimistic updates for immediate UI feedback.
 * Automatically recalculates total amount from updated items.
 * Rolls back changes on error.
 *
 * @returns Mutation hook for updating quotes
 *
 * @example
 * const { mutate: updateQuote } = useUpdateQuote();
 * updateQuote({ id: 'quote-123', status: 'ACCEPTED', acceptedDate: new Date() });
 *
 * Cache behavior:
 * - Optimistically updates quote metadata (status, amount, dates, etc.)
 * - Optimistically updates quote items (descriptions, quantities, prices, etc.)
 * - Invalidates quote lists, metadata, and items on success
 * - Rolls back to previous state on error
 *
 * Toast notifications:
 * - Success: "Quote updated successfully"
 * - Error: "Failed to update quote"
 */
export function useUpdateQuote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateQuoteInput) => {
      const result = await updateQuote(data);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onMutate: async (newData) => {
      const metadataKey = QUOTE_KEYS.metadata(newData.id);
      const itemsKey = QUOTE_KEYS.items(newData.id);

      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: metadataKey });
      await queryClient.cancelQueries({ queryKey: itemsKey });
      await queryClient.cancelQueries({ queryKey: QUOTE_KEYS.lists() });

      // Snapshot the previous values
      const previousMetadata = queryClient.getQueryData<QuoteMetadata>(metadataKey);
      const previousItems = queryClient.getQueryData<QuoteItem[]>(itemsKey);

      // Calculate new total amount from items
      const totalAmount = newData.items.reduce(
        (sum, item) => sum + item.quantity * item.unitPrice,
        0,
      );

      // Optimistically update metadata
      if (previousMetadata) {
        queryClient.setQueryData<QuoteMetadata>(metadataKey, {
          ...previousMetadata,
          status: newData.status,
          amount: totalAmount,
          gst: newData.gst,
          discount: newData.discount,
          currency: newData.currency,
          issuedDate: newData.issuedDate,
          validUntil: newData.validUntil,
          notes: newData.notes,
          terms: newData.terms,
        });
      }

      // Optimistically update items
      if (previousItems) {
        queryClient.setQueryData<QuoteItem[]>(
          itemsKey,
          newData.items.map((item, index) => ({
            id: item.id ?? previousItems[index]?.id ?? '',
            quoteId: newData.id,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: item.quantity * item.unitPrice,
            productId: item.productId ?? null,
            notes: item.notes ?? previousItems[index]?.notes ?? null,
            order: index,
            colors: item.colors ?? previousItems[index]?.colors ?? [],
            createdAt: previousItems[index]?.createdAt ?? new Date(),
            attachments: previousItems[index]?.attachments ?? [],
          })),
        );
      }

      return { previousMetadata, previousItems };
    },
    onError: (err, newData, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousMetadata) {
        queryClient.setQueryData(QUOTE_KEYS.metadata(newData.id), context.previousMetadata);
      }
      if (context?.previousItems) {
        queryClient.setQueryData(QUOTE_KEYS.items(newData.id), context.previousItems);
      }
      toast.error(err.message || 'Failed to update quote');
    },
    onSettled: (_data, _error, variables) => {
      invalidateQuoteQueries(queryClient, { quoteId: variables.id });
    },
    onSuccess: () => {
      toast.success('Quote updated successfully');
    },
  });
}

/**
 * Marks a quote as accepted.
 * Updates the quote status to ACCEPTED and records the acceptance in the status history.
 * Implements optimistic updates for immediate UI feedback.
 * Rolls back changes on error.
 *
 * @returns Mutation hook for marking quotes as accepted
 *
 * @example
 * const { mutate: acceptQuote } = useMarkQuoteAsAccepted();
 * acceptQuote({ id: 'quote-123', acceptedDate: new Date() });
 *
 * Cache behavior:
 * - Optimistically updates quote metadata status to ACCEPTED
 * - Invalidates quote lists, metadata, and statistics on success
 * - Rolls back to previous state on error
 *
 * Toast notifications:
 * - Success: "Quote marked as accepted"
 * - Error: "Failed to mark quote as accepted"
 */
export function useMarkQuoteAsAccepted() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: MarkQuoteAsAcceptedData) => {
      const result = await markQuoteAsAccepted(data);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onMutate: async (newData) => {
      const metadataKey = QUOTE_KEYS.metadata(newData.id);

      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: metadataKey });
      await queryClient.cancelQueries({ queryKey: QUOTE_KEYS.lists() });

      // Snapshot the previous value
      const previousMetadata = queryClient.getQueryData<QuoteMetadata>(metadataKey);

      // Optimistically update to the new value
      if (previousMetadata) {
        queryClient.setQueryData<QuoteMetadata>(metadataKey, {
          ...previousMetadata,
          status: 'ACCEPTED' as const,
        });
      }

      return { previousMetadata, id: newData.id };
    },
    onError: (err, newData, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousMetadata) {
        queryClient.setQueryData(QUOTE_KEYS.metadata(newData.id), context.previousMetadata);
      }
      toast.error(err.message || 'Failed to mark quote as accepted');
    },
    onSettled: (_data, _error, variables) => {
      invalidateQuoteQueries(queryClient, { quoteId: variables.id });
    },
    onSuccess: () => {
      toast.success('Quote marked as accepted');
    },
  });
}

/**
 * Marks a quote as rejected.
 * Updates the quote status to REJECTED and records the rejection reason in the status history.
 * Implements optimistic updates for immediate UI feedback.
 * Rolls back changes on error.
 *
 * @returns Mutation hook for marking quotes as rejected
 *
 * @example
 * const { mutate: rejectQuote } = useMarkQuoteAsRejected();
 * rejectQuote({ id: 'quote-123', rejectionReason: 'Customer found cheaper alternative' });
 *
 * Cache behavior:
 * - Optimistically updates quote metadata status to REJECTED
 * - Invalidates quote lists, metadata, and statistics on success
 * - Rolls back to previous state on error
 *
 * Toast notifications:
 * - Success: "Quote marked as rejected"
 * - Error: "Failed to mark quote as rejected"
 */
export function useMarkQuoteAsRejected() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: MarkQuoteAsRejectedData) => {
      const result = await markQuoteAsRejected(data);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onMutate: async (newData) => {
      const metadataKey = QUOTE_KEYS.metadata(newData.id);

      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: metadataKey });
      await queryClient.cancelQueries({ queryKey: QUOTE_KEYS.lists() });

      // Snapshot the previous value
      const previousMetadata = queryClient.getQueryData<QuoteMetadata>(metadataKey);

      // Optimistically update to the new value
      if (previousMetadata) {
        queryClient.setQueryData<QuoteMetadata>(metadataKey, {
          ...previousMetadata,
          status: 'REJECTED' as const,
        });
      }

      return { previousMetadata, id: newData.id };
    },
    onError: (err, newData, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousMetadata) {
        queryClient.setQueryData(QUOTE_KEYS.metadata(newData.id), context.previousMetadata);
      }
      toast.error(err.message || 'Failed to mark quote as rejected');
    },
    onSettled: (_data, _error, variables) => {
      invalidateQuoteQueries(queryClient, { quoteId: variables.id });
    },
    onSuccess: () => {
      toast.success('Quote marked as rejected');
    },
  });
}

/**
 * Marks a quote as sent and optionally queues an email to the customer.
 * Updates the quote status to SENT and records the sent date.
 * Implements optimistic updates for immediate UI feedback.
 * Rolls back changes on error.
 *
 * @returns Mutation hook for marking quotes as sent
 *
 * @example
 * const { mutate: markAsSent } = useMarkQuoteAsSent();
 * // Mark as sent without sending email
 * markAsSent('quote-123');
 * // Mark as sent and queue email
 * markAsSent({ id: 'quote-123', sendEmail: true });
 *
 * Cache behavior:
 * - Optimistically updates quote metadata status to SENT
 * - Invalidates quote lists, metadata, and statistics on success
 * - Rolls back to previous state on error
 *
 * Toast notifications:
 * - Success: "Quote marked as sent"
 * - Warning: "Quote marked as sent, but email was not sent" (if email queueing fails)
 * - Error: "Failed to mark quote as sent"
 */
export function useMarkQuoteAsSent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: string | { id: string; sendEmail?: boolean }) => {
      const id = typeof params === 'string' ? params : params.id;
      const options = typeof params === 'string' ? undefined : { sendEmail: params.sendEmail };
      const result = await markQuoteAsSent({ id, options });
      if (!result.success) {
        throw new Error(result.error);
      }
      return { ...result.data, message: result.message };
    },
    onMutate: async (params: string | { id: string; sendEmail?: boolean }) => {
      const id = typeof params === 'string' ? params : params.id;
      const metadataKey = QUOTE_KEYS.metadata(id);

      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: metadataKey });
      await queryClient.cancelQueries({ queryKey: QUOTE_KEYS.lists() });

      // Snapshot the previous value
      const previousMetadata = queryClient.getQueryData<QuoteMetadata>(metadataKey);

      // Optimistically update to the new value
      if (previousMetadata) {
        queryClient.setQueryData<QuoteMetadata>(metadataKey, {
          ...previousMetadata,
          status: 'SENT' as const,
        });
      }

      return { previousMetadata, id };
    },
    onError: (err, params, context) => {
      const id = typeof params === 'string' ? params : params.id;
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousMetadata) {
        queryClient.setQueryData(QUOTE_KEYS.metadata(id), context.previousMetadata);
      }
      toast.error(err.message || 'Failed to mark quote as sent');
    },
    onSettled: (_data, _error, params) => {
      const id = typeof params === 'string' ? params : params.id;
      invalidateQuoteQueries(queryClient, { quoteId: id });
    },
    onSuccess: (data) => {
      if (data.message) {
        toast.warning('Quote marked as sent, but email was not sent', {
          description: data.message,
          duration: 10000,
        });
      } else {
        toast.success('Quote marked as sent');
      }
    },
  });
}

/**
 * Puts a quote on hold.
 * Updates the quote status to ON_HOLD and records the reason in the status history.
 * Useful for temporarily pausing a quote when waiting for customer decisions or external factors.
 * Implements optimistic updates for immediate UI feedback.
 * Rolls back changes on error.
 *
 * @returns Mutation hook for putting quotes on hold
 *
 * @example
 * const { mutate: putOnHold } = useMarkQuoteAsOnHold();
 * putOnHold({ id: 'quote-123', reason: 'Waiting for customer to finalise budget' });
 *
 * Cache behavior:
 * - Optimistically updates quote metadata status to ON_HOLD
 * - Invalidates quote lists, metadata, and statistics on success
 * - Rolls back to previous state on error
 *
 * Toast notifications:
 * - Success: "Quote put on hold"
 * - Error: "Failed to put quote on hold"
 */
export function useMarkQuoteAsOnHold() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: MarkQuoteAsOnHoldData) => {
      const result = await markQuoteAsOnHold(data);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onMutate: async (newData) => {
      const metadataKey = QUOTE_KEYS.metadata(newData.id);

      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: metadataKey });
      await queryClient.cancelQueries({ queryKey: QUOTE_KEYS.lists() });

      // Snapshot the previous value
      const previousMetadata = queryClient.getQueryData<QuoteMetadata>(metadataKey);

      // Optimistically update to the new value
      if (previousMetadata) {
        queryClient.setQueryData<QuoteMetadata>(metadataKey, {
          ...previousMetadata,
          status: 'ON_HOLD' as const,
        });
      }

      return { previousMetadata, id: newData.id };
    },
    onError: (err, newData, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousMetadata) {
        queryClient.setQueryData(QUOTE_KEYS.metadata(newData.id), context.previousMetadata);
      }
      toast.error(err.message || 'Failed to put quote on hold');
    },
    onSettled: (_data, _error, variables) => {
      invalidateQuoteQueries(queryClient, { quoteId: variables.id });
    },
    onSuccess: () => {
      toast.success('Quote put on hold');
    },
  });
}

/**
 * Cancels a quote.
 * Updates the quote status to CANCELLED and records the cancellation reason in the status history.
 * Use when a quote is no longer valid or the customer is no longer interested.
 * Implements optimistic updates for immediate UI feedback.
 * Rolls back changes on error.
 *
 * @returns Mutation hook for cancelling quotes
 *
 * @example
 * const { mutate: cancelQuote } = useMarkQuoteAsCancelled();
 * cancelQuote({ id: 'quote-123', reason: 'Customer decided not to proceed' });
 *
 * Cache behavior:
 * - Optimistically updates quote metadata status to CANCELLED
 * - Invalidates quote lists, metadata, and statistics on success
 * - Rolls back to previous state on error
 *
 * Toast notifications:
 * - Success: "Quote cancelled"
 * - Error: "Failed to cancel quote"
 */
export function useMarkQuoteAsCancelled() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: MarkQuoteAsCancelledData) => {
      const result = await markQuoteAsCancelled(data);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onMutate: async (newData) => {
      const metadataKey = QUOTE_KEYS.metadata(newData.id);

      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: metadataKey });
      await queryClient.cancelQueries({ queryKey: QUOTE_KEYS.lists() });

      // Snapshot the previous value
      const previousMetadata = queryClient.getQueryData<QuoteMetadata>(metadataKey);

      // Optimistically update to the new value
      if (previousMetadata) {
        queryClient.setQueryData<QuoteMetadata>(metadataKey, {
          ...previousMetadata,
          status: 'CANCELLED' as const,
        });
      }

      return { previousMetadata, id: newData.id };
    },
    onError: (err, newData, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousMetadata) {
        queryClient.setQueryData(QUOTE_KEYS.metadata(newData.id), context.previousMetadata);
      }
      toast.error(err.message || 'Failed to cancel quote');
    },
    onSettled: (_data, _error, variables) => {
      invalidateQuoteQueries(queryClient, { quoteId: variables.id });
    },
    onSuccess: () => {
      toast.success('Quote cancelled');
    },
  });
}

/**
 * Converts an accepted quote into an invoice.
 * Creates a new invoice with all quote items and marks the quote as CONVERTED.
 * Quote must be in ACCEPTED status to be converted.
 * Implements optimistic updates for immediate UI feedback.
 * Rolls back changes on error.
 *
 * @returns Mutation hook for converting quotes to invoices
 *
 * @example
 * const { mutate: convertToInvoice } = useConvertQuoteToInvoice();
 * convertToInvoice({
 *   id: 'quote-123',
 *   dueDate: new Date('2026-04-30'),
 *   gst: 10,
 *   discount: 5
 * });
 *
 * Cache behavior:
 * - Optimistically updates quote metadata status to CONVERTED
 * - Invalidates quote lists, metadata, statistics, and invoice queries on success
 * - Rolls back to previous state on error
 *
 * Toast notifications:
 * - Success: "Quote converted to invoice INV-001" (with invoice number)
 * - Error: "Failed to convert quote to invoice"
 */
export function useConvertQuoteToInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: ConvertQuoteToInvoiceData) => {
      const result = await convertQuoteToInvoice({
        ...data,
        gst: data.gst ?? 10,
        discount: data.discount ?? 0,
      });
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onMutate: async (newData) => {
      const metadataKey = QUOTE_KEYS.metadata(newData.id);

      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: metadataKey });
      await queryClient.cancelQueries({ queryKey: QUOTE_KEYS.lists() });

      // Snapshot the previous value
      const previousMetadata = queryClient.getQueryData<QuoteMetadata>(metadataKey);

      // Optimistically update to the new value
      if (previousMetadata) {
        queryClient.setQueryData<QuoteMetadata>(metadataKey, {
          ...previousMetadata,
          status: 'CONVERTED' as const,
        });
      }

      return { previousMetadata, id: newData.id };
    },
    onError: (err, newData, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousMetadata) {
        queryClient.setQueryData(QUOTE_KEYS.metadata(newData.id), context.previousMetadata);
      }
      toast.error(err.message || 'Failed to convert quote to invoice');
    },
    onSettled: (_data, _error, variables) => {
      invalidateQuoteQueries(queryClient, { quoteId: variables.id, includeInvoices: true });
    },
    onSuccess: (data) => {
      toast.success(`Quote converted to invoice ${data.invoiceNumber}`);
    },
  });
}

/**
 * Checks and expires quotes that are past their valid until date.
 * Automatically updates all eligible quotes from DRAFT or SENT status to EXPIRED.
 * Useful for batch processing or manual expiry checks.
 *
 * @returns Mutation hook for expiring quotes
 *
 * @example
 * const { mutate: expireQuotes } = useExpireQuotes();
 * expireQuotes(); // No parameters needed
 *
 * Cache behavior:
 * - Invalidates all quote lists and statistics after expiring quotes
 *
 * Toast notifications:
 * - Success: "3 quote(s) expired" (if quotes were expired)
 * - No notification if no quotes were expired
 * - Error: "Failed to expire quotes"
 */
export function useExpireQuotes() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const result = await checkAndExpireQuotes();
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onSuccess: (data) => {
      if (data.count > 0) {
        invalidateQuoteQueries(queryClient);
        toast.success(`${data.count} quote(s) expired`);
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to expire quotes');
    },
  });
}

/**
 * Deletes a quote permanently.
 * Only quotes in DRAFT status can be deleted (enforced by backend).
 * Implements optimistic updates by removing the quote from cache immediately.
 * Rolls back changes on error.
 *
 * @returns Mutation hook for deleting quotes
 *
 * @example
 * const { mutate: deleteQuote } = useDeleteQuote();
 * deleteQuote('quote-123');
 *
 * Cache behavior:
 * - Optimistically removes quote from detail cache
 * - Invalidates quote lists and statistics on success
 * - Restores previous cache state on error
 *
 * Toast notifications:
 * - Success: "Quote deleted"
 * - Error: "Failed to delete quote" (e.g., if quote is not in DRAFT status)
 */
export function useDeleteQuote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const result = await deleteQuote(id);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onMutate: async (id: string) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: QUOTE_KEYS.detail(id) });
      await queryClient.cancelQueries({ queryKey: QUOTE_KEYS.lists() });

      // Snapshot the previous values
      const previousQuote = queryClient.getQueryData(QUOTE_KEYS.detail(id));
      const previousLists = queryClient.getQueriesData({ queryKey: QUOTE_KEYS.lists() });

      // Optimistically remove from detail cache
      queryClient.removeQueries({ queryKey: QUOTE_KEYS.detail(id) });

      // Return context for rollback
      return { previousQuote, previousLists, id };
    },
    onError: (error: Error, id, context) => {
      // Rollback optimistic update
      if (context?.previousQuote) {
        queryClient.setQueryData(QUOTE_KEYS.detail(id), context.previousQuote);
      }
      if (context?.previousLists) {
        context.previousLists.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      toast.error(error.message || 'Failed to delete quote');
    },
    onSettled: () => {
      invalidateQuoteQueries(queryClient);
    },
    onSuccess: () => {
      toast.success('Quote deleted');
    },
  });
}

/**
 * Creates a new version of an existing quote.
 * Increments the version number and creates a linked revision of the current quote.
 * Useful for tracking quote changes while maintaining history.
 * The new version becomes the current quote and the old one is archived.
 *
 * @returns Mutation hook for creating quote versions
 *
 * @example
 * const { mutate: createVersion } = useCreateQuoteVersion();
 * createVersion('quote-123');
 *
 * Cache behavior:
 * - Invalidates all quote details, lists, and statistics
 * - Ensures version history is refreshed
 *
 * Toast notifications:
 * - Success: "Version 2 created successfully (QUO-001)" (with version number and quote number)
 * - Error: "Failed to create quote version"
 */
export function useCreateQuoteVersion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (quoteId: string) => {
      const result = await createQuoteVersion({ quoteId });
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onSuccess: (data) => {
      invalidateQuoteQueries(queryClient, { invalidateAllDetails: true });
      toast.success(`Version ${data.versionNumber} created successfully (${data.quoteNumber})`);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create quote version');
    },
  });
}

/**
 * Duplicates a quote.
 * Creates an independent copy (not a version) with a new quote number and DRAFT status.
 * Useful for reusing quote structures as templates or creating similar quotes for different customers.
 *
 * @returns Mutation hook for duplicating quotes
 *
 * Cache behavior:
 * - Invalidates all quote lists and statistics
 * - No optimistic updates (waits for server response)
 *
 * Toast notifications:
 * - Success: "Quote duplicated successfully (QUO-002)" (with new quote number)
 * - Error: "Failed to duplicate quote"
 */
export function useDuplicateQuote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (quoteId: string) => {
      const result = await duplicateQuote(quoteId);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onSuccess: (data) => {
      invalidateQuoteQueries(queryClient);
      toast.success(`Quote duplicated successfully (${data.quoteNumber})`);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to duplicate quote');
    },
  });
}

/**
 * Downloads a quote as a PDF file.
 * Generates a PDF from the quote template and triggers a browser download.
 * The PDF includes all quote details, items, and formatted pricing.
 *
 * @returns Mutation hook for downloading quote PDFs
 *
 * @example
 * const { mutate: downloadPdf } = useDownloadQuotePdf();
 * downloadPdf('quote-123');
 *
 * Cache behavior:
 * - No cache updates (read-only operation)
 *
 * Toast notifications:
 * - Success: "PDF downloaded successfully"
 * - Error: "Failed to download PDF"
 */
export function useDownloadQuotePdf() {
  return useMutation({
    mutationFn: async (quoteId: string) => {
      const result = await getQuotePdfUrl(quoteId);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onSuccess: (data) => {
      // Force download instead of opening in new tab
      const link = document.createElement('a');
      link.href = data.url;
      link.download = data.filename;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('PDF downloaded successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to download PDF');
    },
  });
}

/**
 * Queues an email to be sent for a quote.
 * Supports different email types: sent notification, reminder, acceptance confirmation, or rejection notification.
 * Emails are queued asynchronously via Inngest and sent in the background.
 *
 * @returns Mutation hook for sending quote emails
 *
 * @example
 * const { mutate: sendEmail } = useSendQuoteEmail();
 * sendEmail({ quoteId: 'quote-123', type: 'sent' });
 * sendEmail({ quoteId: 'quote-456', type: 'reminder' });
 *
 * Cache behavior:
 * - Invalidates the specific quote's detail cache to reflect email sent status
 *
 * Toast notifications:
 * - Success: "Email queued successfully"
 * - Error: "Failed to send email"
 */
export function useSendQuoteEmail() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      quoteId: string;
      type: 'sent' | 'reminder' | 'accepted' | 'rejected';
    }) => {
      const result = await sendQuoteEmail(data);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: QUOTE_KEYS.detail(variables.quoteId),
      });
      toast.success('Email queued successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to send email');
    },
  });
}

/**
 * Queues a follow-up email to be sent for a quote.
 * Used to remind customers about pending quotes that haven't received a response.
 * Follow-up emails are queued asynchronously via Inngest and sent in the background.
 *
 * @returns Mutation hook for sending quote follow-up emails
 *
 * @example
 * const { mutate: sendFollowUp } = useSendQuoteFollowUp();
 * sendFollowUp('quote-123');
 *
 * Cache behavior:
 * - Invalidates the specific quote's detail cache to reflect follow-up sent status
 *
 * Toast notifications:
 * - Success: "Follow-up email queued successfully"
 * - Error: "Failed to send follow-up"
 */
export function useSendQuoteFollowUp() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (quoteId: string) => {
      const result = await sendQuoteFollowUp(quoteId);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onSuccess: (_, quoteId) => {
      queryClient.invalidateQueries({
        queryKey: QUOTE_KEYS.detail(quoteId),
      });
      toast.success('Follow-up email queued successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to send follow-up');
    },
  });
}

/**
 * Fetches attachments for a specific quote item.
 * Returns all image and file attachments associated with a quote line item.
 * Useful for displaying reference images, colour palettes, or design samples.
 *
 * @param quoteItemId - The quote item ID to fetch attachments for
 * @returns Query result containing the quote item's attachments
 */
export function useQuoteItemAttachments(quoteItemId: string | undefined) {
  return useQuery({
    queryKey: QUOTE_KEYS.itemAttachments(quoteItemId ?? ''), // Keep for type safety
    queryFn: quoteItemId
      ? async () => {
          const result = await getQuoteItemAttachments(quoteItemId);
          if (!result.success) {
            throw new Error(result.error);
          }
          return result.data;
        }
      : skipToken,
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Uploads an attachment (image or file) to a quote item.
 * Uploads the file to cloud storage and creates a database reference.
 * Useful for adding reference images, design samples, or colour palettes to quote items.
 *
 * @returns Mutation hook for uploading quote item attachments
 *
 * @example
 * const { mutate: uploadAttachment } = useUploadQuoteItemAttachment();
 * uploadAttachment({
 *   quoteItemId: 'item-123',
 *   quoteId: 'quote-123',
 *   file: selectedFile
 * });
 *
 * Cache behavior:
 * - Invalidates quote item attachments cache
 * - Invalidates quote detail and list caches to reflect new attachment count
 *
 * Toast notifications:
 * - Success: "image.jpg uploaded successfully" (with filename)
 * - Error: "Failed to upload image"
 */
export function useUploadQuoteItemAttachment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { quoteItemId: string; quoteId: string; file: File }) => {
      const formData = new FormData();
      formData.append('quoteItemId', data.quoteItemId);
      formData.append('quoteId', data.quoteId);
      formData.append('file', data.file);

      const result = await uploadQuoteItemAttachment(formData);
      if (!result.success) {
        throw new Error(result.error);
      }
      return { ...result.data, quoteId: data.quoteId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: QUOTE_KEYS.itemAttachments(data.quoteItemId) });
      invalidateQuoteQueries(queryClient, { quoteId: data.quoteId });
      toast.success(`${data.fileName} uploaded successfully`);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to upload image');
    },
  });
}

/**
 * Deletes an attachment from a quote item.
 * Removes the file from cloud storage and deletes the database reference.
 * Implements optimistic updates by immediately removing the attachment from the UI.
 * Rolls back changes on error.
 *
 * @returns Mutation hook for deleting quote item attachments
 *
 * @example
 * const { mutate: deleteAttachment } = useDeleteQuoteItemAttachment();
 * deleteAttachment({
 *   attachmentId: 'att-123',
 *   quoteItemId: 'item-123',
 *   quoteId: 'quote-123'
 * });
 *
 * Cache behavior:
 * - Optimistically removes attachment from quote items cache
 * - Invalidates quote item attachments and quote data on success
 * - Rolls back to previous state on error
 *
 * Toast notifications:
 * - Success: "Image deleted successfully"
 * - Error: "Failed to delete image"
 */
export function useDeleteQuoteItemAttachment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { attachmentId: string; quoteItemId: string; quoteId: string }) => {
      const result = await deleteQuoteItemAttachment({
        attachmentId: data.attachmentId,
        quoteId: data.quoteId,
      });
      if (!result.success) {
        throw new Error(result.error);
      }
      return { ...result.data, quoteItemId: data.quoteItemId, quoteId: data.quoteId };
    },
    onMutate: async (data) => {
      const itemsKey = QUOTE_KEYS.items(data.quoteId);

      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: QUOTE_KEYS.itemAttachments(data.quoteItemId) });
      await queryClient.cancelQueries({ queryKey: itemsKey });

      // Snapshot the previous values
      const previousItemAttachments = queryClient.getQueryData(
        QUOTE_KEYS.itemAttachments(data.quoteItemId),
      );
      const previousItems = queryClient.getQueryData<QuoteItem[]>(itemsKey);

      // Optimistically remove attachment from items
      if (previousItems) {
        queryClient.setQueryData<QuoteItem[]>(
          itemsKey,
          previousItems.map((item) => {
            if (item.id === data.quoteItemId) {
              return {
                ...item,
                attachments: item.attachments.filter((att) => att.id !== data.attachmentId),
              };
            }
            return item;
          }),
        );
      }

      return { previousItemAttachments, previousItems };
    },
    onError: (error: Error, data, context) => {
      // Rollback optimistic update
      if (context?.previousItemAttachments) {
        queryClient.setQueryData(
          QUOTE_KEYS.itemAttachments(data.quoteItemId),
          context.previousItemAttachments,
        );
      }
      if (context?.previousItems) {
        queryClient.setQueryData(QUOTE_KEYS.items(data.quoteId), context.previousItems);
      }
      toast.error(error.message || 'Failed to delete image');
    },
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({
        queryKey: QUOTE_KEYS.itemAttachments(variables.quoteItemId),
      });
      invalidateQuoteQueries(queryClient, { quoteId: variables.quoteId });
    },
    onSuccess: () => {
      toast.success('Image deleted successfully');
    },
  });
}

/**
 * Gets a download URL for a quote item attachment and triggers download.
 * Generates a signed URL from cloud storage and initiates browser download.
 * Use when users want to download attachments to their device.
 *
 * @returns Mutation hook for downloading quote item attachments
 *
 * @example
 * const { mutate: downloadAttachment } = useGetItemAttachmentDownloadUrl();
 * downloadAttachment('att-123');
 *
 * Cache behavior:
 * - No cache updates (read-only operation)
 *
 * Toast notifications:
 * - Success: "Download started"
 * - Error: "Failed to download image"
 */
export function useGetItemAttachmentDownloadUrl() {
  return useMutation({
    mutationFn: async (attachmentId: string) => {
      const result = await getItemAttachmentDownloadUrl(attachmentId);
      if (!result.success) {
        throw new Error(result.error);
      }

      return result.data;
    },
    onSuccess: (data) => {
      // Trigger download
      const link = document.createElement('a');
      link.href = data.url;
      link.download = data.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Download started');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to download image');
    },
  });
}

/**
 * Updates the notes for a specific quote item.
 * Allows adding detailed specifications, requirements, or internal comments to quote line items.
 * Implements optimistic updates for immediate UI feedback.
 * Rolls back changes on error.
 *
 * @returns Mutation hook for updating quote item notes
 *
 * @example
 * const { mutate: updateNotes } = useUpdateQuoteItemNotes();
 * updateNotes({
 *   quoteItemId: 'item-123',
 *   quoteId: 'quote-123',
 *   notes: 'Customer prefers matte finish'
 * });
 *
 * Cache behavior:
 * - Optimistically updates notes in quote items cache
 * - Invalidates quote items cache on success to ensure consistency
 * - Rolls back to previous state on error
 *
 * Toast notifications:
 * - Success: "Notes updated successfully"
 * - Error: "Failed to update notes"
 */
export function useUpdateQuoteItemNotes() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { quoteItemId: string; quoteId: string; notes: string }) => {
      const result = await updateQuoteItemNotes({
        quoteItemId: data.quoteItemId,
        quoteId: data.quoteId,
        notes: data.notes,
      });

      if (!result.success) {
        throw new Error(result.error);
      }
      return { ...result.data, quoteId: data.quoteId };
    },
    onMutate: async (data) => {
      const itemsKey = QUOTE_KEYS.items(data.quoteId);

      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: itemsKey });

      // Snapshot the previous value
      const previousItems = queryClient.getQueryData<QuoteItem[]>(itemsKey);

      // Optimistically update notes in items
      if (previousItems) {
        queryClient.setQueryData<QuoteItem[]>(
          itemsKey,
          previousItems.map((item) => {
            if (item.id === data.quoteItemId) {
              return {
                ...item,
                notes: data.notes,
              };
            }
            return item;
          }),
        );
      }

      return { previousItems };
    },
    onError: (error: Error, data, context) => {
      // Rollback optimistic update
      if (context?.previousItems) {
        queryClient.setQueryData(QUOTE_KEYS.items(data.quoteId), context.previousItems);
      }
      toast.error(error.message || 'Failed to update notes');
    },
    onSettled: (_data, _error, variables) => {
      // Always refetch to ensure cache consistency
      queryClient.invalidateQueries({ queryKey: QUOTE_KEYS.items(variables.quoteId) });
    },
    onSuccess: () => {
      toast.success('Notes updated successfully');
    },
  });
}

/**
 * Updates the colour palette for a specific quote item.
 * Stores an array of hex colour codes associated with a quote line item.
 * Useful for tracking colour selections for floral arrangements or design work.
 * Implements optimistic updates for immediate UI feedback.
 * Rolls back changes on error.
 *
 * @returns Mutation hook for updating quote item colour palettes
 *
 * @example
 * const { mutate: updateColorPalette } = useUploadQuoteItemColorPalette();
 * updateColorPalette({
 *   quoteItemId: 'item-123',
 *   quoteId: 'quote-123',
 *   colors: ['#FF5733', '#33FF57', '#3357FF']
 * });
 *
 * Cache behavior:
 * - Optimistically updates colours in quote items cache
 * - Invalidates quote items cache on success to ensure consistency
 * - Rolls back to previous state on error
 *
 * Toast notifications:
 * - Success: "Colour palette updated successfully"
 * - Error: "Failed to update colour palette"
 */
export function useUploadQuoteItemColorPalette() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { quoteItemId: string; quoteId: string; colors: string[] }) => {
      const result = await updateQuoteItemColors({
        quoteItemId: data.quoteItemId,
        quoteId: data.quoteId,
        colors: data.colors,
      });

      if (!result.success) {
        throw new Error(result.error);
      }

      return { ...result.data, quoteId: data.quoteId };
    },
    onMutate: async (data) => {
      const itemsKey = QUOTE_KEYS.items(data.quoteId);

      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: itemsKey });

      // Snapshot the previous value
      const previousItems = queryClient.getQueryData<QuoteItem[]>(itemsKey);

      // Optimistically update colors in items
      if (previousItems) {
        queryClient.setQueryData<QuoteItem[]>(
          itemsKey,
          previousItems.map((item) => {
            if (item.id === data.quoteItemId) {
              return {
                ...item,
                colors: data.colors,
              };
            }
            return item;
          }),
        );
      }

      return { previousItems };
    },
    onError: (error: Error, data, context) => {
      // Rollback optimistic update
      if (context?.previousItems) {
        queryClient.setQueryData(QUOTE_KEYS.items(data.quoteId), context.previousItems);
      }
      toast.error(error.message || 'Failed to update color palette');
    },
    onSettled: (_data, _error, variables) => {
      // Always refetch to ensure cache consistency
      queryClient.invalidateQueries({ queryKey: QUOTE_KEYS.items(variables.quoteId) });
    },
    onSuccess: () => {
      toast.success('Color palette updated successfully');
    },
  });
}

// ============================================================================
// ANALYTICS HOOKS
// ============================================================================

/**
 * Fetches monthly quote value trend data for analytics dashboards.
 * Returns aggregated quote values grouped by month, useful for visualising business trends over time.
 * Data is cached for 5 minutes to balance freshness with performance.
 *
 * @param limit - Number of months to retrieve. Defaults to 12.
 * @returns Query result with monthly quote value trends
 *
 * @example
 * const { data: trends } = useQuoteValueTrend(6); // Last 6 months
 * const { data: yearTrends } = useQuoteValueTrend(12); // Last year
 */
export function useQuoteValueTrend(limit?: number) {
  return useQuery({
    queryKey: QUOTE_KEYS.analytics.valueTrend(limit),
    queryFn: async () => {
      const result = await getMonthlyQuoteValueTrend(limit);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Fetches quote conversion funnel data for analytics dashboards.
 * Shows the progression of quotes through different statuses (draft, sent, accepted, rejected, etc.).
 * Useful for identifying conversion bottlenecks and quote effectiveness.
 * Uses placeholder data to prevent layout shifts when date filter changes.
 * Data is cached for 5 minutes to balance freshness with performance.
 *
 * @param dateFilter - Optional date range filter
 * @param dateFilter.startDate - Start date for filtering funnel data
 * @param dateFilter.endDate - End date for filtering funnel data
 * @returns Query result with conversion funnel data
 *
 * @example
 * const { data: funnel } = useConversionFunnel();
 * const { data: filteredFunnel } = useConversionFunnel({
 *   startDate: new Date('2026-01-01'),
 *   endDate: new Date('2026-03-31')
 * });
 */
export function useConversionFunnel(dateFilter?: { startDate?: Date; endDate?: Date }) {
  // Normalize date filter to ISO date strings for stable query keys
  const normalizedDateFilter = dateFilter
    ? {
        startDate: dateFilter.startDate ? formatDateNormalizer(dateFilter.startDate) : null,
        endDate: dateFilter.endDate ? formatDateNormalizer(dateFilter.endDate) : null,
      }
    : undefined;

  return useQuery({
    queryKey: QUOTE_KEYS.analytics.conversionFunnel(normalizedDateFilter),
    queryFn: async () => {
      const result = await getConversionFunnel(dateFilter);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    placeholderData: keepPreviousData,
  });
}

/**
 * Fetches top customers ranked by total quoted value for analytics dashboards.
 * Returns customers with the highest aggregate quote values, useful for identifying key accounts.
 * Data is cached for 5 minutes to balance freshness with performance.
 *
 * @param limit - Number of customers to retrieve. Defaults to 5.
 * @returns Query result with top customers data
 *
 * @example
 * const { data: topCustomers } = useTopCustomersByQuotedValue(10);
 * const { data: top5 } = useTopCustomersByQuotedValue(); // Default: 5 customers
 */
export function useTopCustomersByQuotedValue(limit?: number) {
  return useQuery({
    queryKey: QUOTE_KEYS.analytics.topCustomers(limit),
    queryFn: async () => {
      const result = await getTopCustomersByQuotedValue(limit);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Fetches average time to decision metrics for analytics dashboards.
 * Calculates the average time between quote creation and acceptance/rejection.
 * Useful for understanding quote response times and sales cycle duration.
 * Data is cached for 5 minutes to balance freshness with performance.
 *
 * @returns Query result with average time to decision data (in days)
 *
 * @example
 * const { data: avgTime } = useAverageTimeToDecision();
 * // data: { averageDays: 7.5, acceptedAverage: 6.2, rejectedAverage: 9.1 }
 */
export function useAverageTimeToDecision() {
  return useQuery({
    queryKey: QUOTE_KEYS.analytics.avgTimeToDecision(),
    queryFn: async () => {
      const result = await getAverageTimeToDecision();
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Updates the status of multiple quotes in a single operation.
 * Useful for batch processing quotes (e.g., marking multiple quotes as sent or cancelled).
 * Provides detailed feedback on successes and failures.
 *
 * @returns Mutation hook for bulk updating quote statuses
 *
 * @example
 * const { mutate: bulkUpdate } = useBulkUpdateQuoteStatus();
 * bulkUpdate({
 *   ids: ['quote-1', 'quote-2', 'quote-3'],
 *   status: 'SENT'
 * });
 *
 * Cache behavior:
 * - Invalidates all quote lists and statistics after update
 *
 * Toast notifications:
 * - Success (all): "3 quotes updated"
 * - Success (single): "Quote updated"
 * - Warning (partial failure): "2 quotes updated, 1 failed. Check console for details."
 * - Error: "Failed to update quotes"
 */
export function useBulkUpdateQuoteStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ ids, status }: { ids: string[]; status: QuoteStatus }) => {
      const result = await bulkUpdateQuoteStatus({ ids, status });
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onSuccess: (data) => {
      if (data.failureCount > 0) {
        toast.warning(
          `${data.successCount} quotes updated, ${data.failureCount} failed. Check console for details.`,
        );
        console.warn(
          'Bulk update failures:',
          data.results.filter((r) => !r.success),
        );
      } else {
        toast.success(
          data.successCount > 1 ? `${data.successCount} quotes updated` : 'Quote updated',
        );
      }
      invalidateQuoteQueries(queryClient);
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update quotes');
    },
  });
}

/**
 * Deletes multiple quotes in a single operation.
 * Only quotes in DRAFT status can be deleted (enforced by backend).
 * Provides detailed feedback on successes and failures.
 * Useful for cleaning up multiple draft quotes at once.
 *
 * @returns Mutation hook for bulk deleting quotes
 *
 * @example
 * const { mutate: bulkDelete } = useBulkDeleteQuotes();
 * bulkDelete(['quote-1', 'quote-2', 'quote-3']);
 *
 * Cache behavior:
 * - Invalidates all quote lists and statistics after deletion
 *
 * Toast notifications:
 * - Success (all): "3 quotes deleted"
 * - Success (single): "Quote deleted"
 * - Warning (partial failure): "2 quotes deleted, 1 failed (likely not in DRAFT status)."
 * - Error: "Failed to delete quotes"
 */
export function useBulkDeleteQuotes() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ids: string[]) => {
      const result = await bulkDeleteQuotes(ids);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onSuccess: (data) => {
      if (data.failureCount > 0) {
        toast.warning(
          `${data.successCount} quotes deleted, ${data.failureCount} failed (likely not in DRAFT status).`,
        );
      } else {
        toast.success(
          data.successCount > 1 ? `${data.successCount} quotes deleted` : 'Quote deleted',
        );
      }
      invalidateQuoteQueries(queryClient);
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to delete quotes');
    },
  });
}

/**
 * Toggles the favourite status of a quote.
 * Allows users to mark important quotes for quick access and filtering.
 * Implements optimistic updates for immediate UI feedback.
 * Rolls back changes on error.
 *
 * @returns Mutation hook for toggling quote favourite status
 *
 * @example
 * const { mutate: toggleFavourite } = useToggleQuoteFavourite();
 * toggleFavourite('quote-123');
 *
 * Cache behavior:
 * - Optimistically toggles favourite status in quote metadata cache
 * - Invalidates quote lists and metadata on success
 * - Rolls back to previous state on error
 *
 * Toast notifications:
 * - Success (adding): "Added to favourites"
 * - Success (removing): "Removed from favourites"
 * - Error: "Failed to update favourite status"
 */
export function useToggleQuoteFavourite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const result = await toggleQuoteFavourite(id);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onMutate: async (id) => {
      const metadataKey = QUOTE_KEYS.metadata(id);

      await queryClient.cancelQueries({ queryKey: metadataKey });
      await queryClient.cancelQueries({ queryKey: QUOTE_KEYS.lists() });

      const previousMetadata = queryClient.getQueryData<QuoteMetadata>(metadataKey);

      if (previousMetadata) {
        queryClient.setQueryData<QuoteMetadata>(metadataKey, {
          ...previousMetadata,
          isFavourite: !previousMetadata.isFavourite,
        });
      }

      return { previousMetadata, id };
    },
    onError: (err, id, context) => {
      if (context?.previousMetadata) {
        queryClient.setQueryData(QUOTE_KEYS.metadata(id), context.previousMetadata);
      }
      toast.error(err.message || 'Failed to update favourite status');
    },
    onSettled: (_data, _error, id) => {
      invalidateQuoteQueries(queryClient, { quoteId: id });
    },
    onSuccess: (data) => {
      toast.success(data.isFavourite ? 'Added to favourites' : 'Removed from favourites');
    },
  });
}
