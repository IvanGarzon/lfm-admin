'use client';

import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
  skipToken,
} from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  getTransactions,
  getTransactionById,
  getTransactionStatistics,
  getTransactionTrend,
  getTransactionCategoryBreakdown,
  getTopTransactionCategories,
  getTransactionCategories,
} from '@/actions/finances/transactions/queries';
import {
  createTransaction,
  updateTransaction,
  deleteTransaction,
  uploadTransactionAttachment,
  deleteTransactionAttachment,
} from '@/actions/finances/transactions/mutations';
import {
  TransactionFilters,
  type TransactionListItem,
} from '@/features/finances/transactions/types';
import type { CreateTransactionInput, UpdateTransactionInput } from '@/schemas/transactions';
import { formatDateNormalizer } from '@/lib/utils';

// -- QUERY KEYS -------------------------------------------------------------

/**
 * Query key factory for transaction-related queries.
 * Provides type-safe, hierarchical query keys for React Query cache management.
 */
export const TRANSACTION_KEYS = {
  all: ['transactions'] as const,
  lists: () => [...TRANSACTION_KEYS.all, 'list'] as const,
  list: (filters: Partial<TransactionFilters>) =>
    [...TRANSACTION_KEYS.lists(), { filters }] as const,
  details: () => [...TRANSACTION_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...TRANSACTION_KEYS.details(), id] as const,
  categories: () => [...TRANSACTION_KEYS.all, 'categories'] as const,
  statistics: () => [...TRANSACTION_KEYS.all, 'statistics'] as const,
  analytics: () => [...TRANSACTION_KEYS.all, 'analytics'] as const,
  trend: (limit?: number) => [...TRANSACTION_KEYS.analytics(), 'trend', { limit }] as const,
  categoryBreakdown: (dateFilter?: {
    startDate?: Date | string | null;
    endDate?: Date | string | null;
  }) => [...TRANSACTION_KEYS.analytics(), 'breakdown', { dateFilter }] as const,
  topCategories: (limit?: number) => [...TRANSACTION_KEYS.analytics(), 'top', { limit }] as const,
};

// -- QUERY HOOKS (Data Fetching) --------------------------------------------

/**
 * Fetches a paginated, filtered list of transactions.
 *
 * @param filters - Filter criteria including search, type, status, and pagination
 * @returns Query result containing the filtered transaction list
 *
 * Cache behaviour:
 * - Data is cached for 30 seconds to prevent excessive refetching
 * - Query automatically refetches when filters change
 * - Cache is invalidated when transactions are created, updated, or deleted
 */
export function useTransactions(filters: Partial<TransactionFilters> = {}) {
  return useQuery({
    queryKey: TRANSACTION_KEYS.list(filters),
    queryFn: async () => {
      const searchParams: Record<string, string | string[]> = {};

      if (filters.search) searchParams.search = filters.search;
      if (filters.type) searchParams.type = filters.type;
      if (filters.status && filters.status.length > 0) searchParams.status = filters.status;
      if (filters.page) searchParams.page = String(filters.page);
      if (filters.perPage) searchParams.perPage = String(filters.perPage);

      const result = await getTransactions(searchParams);
      if (!result.success) {
        throw new Error(result.error);
      }

      return result.data;
    },
    staleTime: 30 * 1000,
  });
}

/**
 * Fetches full details for a single transaction by ID.
 *
 * @param id - The transaction ID to fetch, or undefined to skip the query
 * @returns Query result containing the transaction with categories and attachments
 *
 * Cache behaviour:
 * - Data is cached for 30 seconds
 * - Query is skipped when id is undefined
 * - Cache is invalidated on update or delete
 */
export function useTransaction(id: string | undefined) {
  return useQuery({
    queryKey: TRANSACTION_KEYS.detail(id ?? ''),
    queryFn: id
      ? async () => {
          const result = await getTransactionById(id);
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
 * Fetches all active transaction categories.
 *
 * @returns Query result containing the list of active categories
 *
 * Cache behaviour:
 * - Data is cached for 5 minutes as categories change infrequently
 * - Cache is invalidated when a category is created
 */
export function useTransactionCategories() {
  return useQuery({
    queryKey: TRANSACTION_KEYS.categories(),
    queryFn: async () => {
      const result = await getTransactionCategories(undefined);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data ?? [];
    },
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Fetches transaction statistics, optionally filtered by a date range.
 *
 * @param dateFilter - Optional date range to scope the statistics
 * @param options - Query options
 * @param options.enabled - Whether the query should run automatically
 * @returns Query result containing income, expense, and cash flow totals
 *
 * Cache behaviour:
 * - Data is cached for 1 minute
 * - Date filter is normalised to ISO strings for stable cache keys
 * - Returns previous data while fetching new results (keepPreviousData)
 */
export function useTransactionStatistics(
  dateFilter?: { startDate?: Date; endDate?: Date },
  options?: { enabled?: boolean },
) {
  const normalizedDateFilter = dateFilter
    ? {
        startDate: dateFilter.startDate ? formatDateNormalizer(dateFilter.startDate) : null,
        endDate: dateFilter.endDate ? formatDateNormalizer(dateFilter.endDate) : null,
      }
    : undefined;

  return useQuery({
    queryKey: [...TRANSACTION_KEYS.statistics(), normalizedDateFilter],
    queryFn: async () => {
      const result = await getTransactionStatistics(dateFilter);
      if (!result.success) {
        throw new Error(result.error);
      }

      return result.data;
    },
    staleTime: 60 * 1000,
    placeholderData: keepPreviousData,
    enabled: options?.enabled,
  });
}

/**
 * Fetches monthly transaction trend data showing income vs expense over time.
 *
 * @param limit - Number of months to retrieve. Defaults to 12.
 * @returns Query result containing monthly income, expense, and net values
 *
 * Cache behaviour:
 * - Data is cached for 5 minutes
 */
export function useTransactionTrend(limit: number = 12) {
  return useQuery({
    queryKey: TRANSACTION_KEYS.trend(limit),
    queryFn: async () => {
      const result = await getTransactionTrend(limit);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Fetches transaction breakdown by category with percentage of total.
 *
 * @param dateFilter - Optional date range to scope the breakdown
 * @returns Query result containing per-category amounts and percentages
 *
 * Cache behaviour:
 * - Data is cached for 5 minutes
 * - Date filter is normalised to ISO strings for stable cache keys
 * - Returns previous data while fetching new results (keepPreviousData)
 */
export function useCategoryBreakdown(dateFilter?: { startDate?: Date; endDate?: Date }) {
  const normalizedDateFilter = dateFilter
    ? {
        startDate: dateFilter.startDate ? formatDateNormalizer(dateFilter.startDate) : null,
        endDate: dateFilter.endDate ? formatDateNormalizer(dateFilter.endDate) : null,
      }
    : undefined;

  return useQuery({
    queryKey: TRANSACTION_KEYS.categoryBreakdown(normalizedDateFilter),
    queryFn: async () => {
      const result = await getTransactionCategoryBreakdown(dateFilter);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    staleTime: 5 * 60 * 1000,
    placeholderData: keepPreviousData,
  });
}

/**
 * Fetches the top transaction categories ranked by total amount.
 *
 * @param limit - Maximum number of categories to return. Defaults to 5.
 * @returns Query result containing the top categories with totals and averages
 *
 * Cache behaviour:
 * - Data is cached for 5 minutes
 */
export function useTopCategories(limit: number = 5) {
  return useQuery({
    queryKey: TRANSACTION_KEYS.topCategories(limit),
    queryFn: async () => {
      const result = await getTopTransactionCategories(limit);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

// -- MUTATION HOOKS (Data Writing) -----------------------------------------

/**
 * Creates a new transaction.
 *
 * @returns Mutation object for creating a transaction
 *
 * Cache behaviour:
 * - Cancels in-flight list queries before mutating
 * - Invalidates lists and statistics on success
 *
 * Toast notifications:
 * - Success: "Transaction {referenceNumber} created successfully"
 * - Error: server error message or "Failed to create transaction"
 */
export function useCreateTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateTransactionInput) => {
      const result = await createTransaction(data);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: TRANSACTION_KEYS.lists() });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: TRANSACTION_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: TRANSACTION_KEYS.statistics() });
      toast.success(
        `Transaction ${data?.referenceNumber != null ? data?.referenceNumber : ''} created successfully`,
      );
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create transaction');
    },
  });
}

/**
 * Updates an existing transaction with optimistic cache update.
 *
 * @returns Mutation object for updating a transaction
 *
 * Cache behaviour:
 * - Optimistically updates the detail cache for instant UI feedback
 * - Rolls back on error
 * - Invalidates detail, lists, and statistics on settled
 *
 * Toast notifications:
 * - Success: "Transaction updated successfully"
 * - Error: server error message or "Failed to update transaction"
 */
export function useUpdateTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateTransactionInput) => {
      const result = await updateTransaction(data);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onMutate: async (newData) => {
      await queryClient.cancelQueries({ queryKey: TRANSACTION_KEYS.detail(newData.id) });
      await queryClient.cancelQueries({ queryKey: TRANSACTION_KEYS.lists() });

      const previousTransaction = queryClient.getQueryData(TRANSACTION_KEYS.detail(newData.id));

      queryClient.setQueryData(
        TRANSACTION_KEYS.detail(newData.id),
        (old: TransactionListItem | undefined) => {
          if (!old) {
            return old;
          }

          return {
            ...old,
            ...newData,
          };
        },
      );

      return { previousTransaction };
    },
    onError: (err, newData, context) => {
      if (context?.previousTransaction) {
        queryClient.setQueryData(TRANSACTION_KEYS.detail(newData.id), context.previousTransaction);
      }
      toast.error(err.message || 'Failed to update transaction');
    },
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({ queryKey: TRANSACTION_KEYS.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: TRANSACTION_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: TRANSACTION_KEYS.statistics() });
    },
    onSuccess: () => {
      toast.success('Transaction updated successfully');
    },
  });
}

/**
 * Deletes a transaction with optimistic cache removal.
 *
 * @returns Mutation object for deleting a transaction
 *
 * Cache behaviour:
 * - Optimistically removes transaction from detail and list caches
 * - Rolls back on error
 * - Invalidates lists and statistics on settled
 *
 * Toast notifications:
 * - Success: "Transaction deleted successfully"
 * - Error: server error message or "Failed to delete transaction"
 */
export function useDeleteTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const result = await deleteTransaction(id);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: TRANSACTION_KEYS.detail(id) });
      await queryClient.cancelQueries({ queryKey: TRANSACTION_KEYS.lists() });

      const previousTransaction = queryClient.getQueryData(TRANSACTION_KEYS.detail(id));
      const previousLists = queryClient.getQueriesData({ queryKey: TRANSACTION_KEYS.lists() });

      queryClient.removeQueries({ queryKey: TRANSACTION_KEYS.detail(id) });

      return { previousTransaction, previousLists, id };
    },
    onError: (error: Error, id, context) => {
      if (context?.previousTransaction) {
        queryClient.setQueryData(TRANSACTION_KEYS.detail(id), context.previousTransaction);
      }
      if (context?.previousLists) {
        context.previousLists.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      toast.error(error.message || 'Failed to delete transaction');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: TRANSACTION_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: TRANSACTION_KEYS.statistics() });
    },
    onSuccess: () => {
      toast.success('Transaction deleted successfully');
    },
  });
}

/**
 * Uploads a file attachment to a transaction.
 *
 * @returns Mutation object for uploading an attachment
 *
 * Cache behaviour:
 * - Invalidates the transaction detail and list caches on success
 *
 * Toast notifications:
 * - Success: "Attachment uploaded successfully"
 * - Error: server error message or "Failed to upload attachment"
 */
export function useUploadTransactionAttachment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { transactionId: string; file: File }) => {
      const formData = new FormData();
      formData.append('transactionId', data.transactionId);
      formData.append('file', data.file);

      const result = await uploadTransactionAttachment(formData);
      if (!result.success) {
        throw new Error(result.error);
      }
      return { ...result.data, transactionId: data.transactionId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: TRANSACTION_KEYS.detail(data.transactionId) });
      queryClient.invalidateQueries({ queryKey: TRANSACTION_KEYS.lists() });
      toast.success('Attachment uploaded successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to upload attachment');
    },
  });
}

/**
 * Deletes an attachment from a transaction with optimistic cache update.
 *
 * @returns Mutation object for deleting an attachment
 *
 * Cache behaviour:
 * - Optimistically removes the attachment from the transaction detail cache
 * - Rolls back on error
 * - Invalidates the transaction detail and list caches on settled
 *
 * Toast notifications:
 * - Success: "Attachment deleted successfully"
 * - Error: server error message or "Failed to delete attachment"
 */
export function useDeleteTransactionAttachment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      attachmentId,
      transactionId,
    }: {
      attachmentId: string;
      transactionId: string;
    }) => {
      const result = await deleteTransactionAttachment(attachmentId);
      if (!result.success) {
        throw new Error(result.error);
      }
      return { ...result.data, transactionId };
    },
    onMutate: async (data) => {
      await queryClient.cancelQueries({ queryKey: TRANSACTION_KEYS.detail(data.transactionId) });
      await queryClient.cancelQueries({ queryKey: TRANSACTION_KEYS.lists() });

      const previousTransaction = queryClient.getQueryData(
        TRANSACTION_KEYS.detail(data.transactionId),
      );

      queryClient.setQueryData(
        TRANSACTION_KEYS.detail(data.transactionId),
        (old: TransactionListItem | undefined) => {
          if (!old) return old;
          return {
            ...old,
            attachments: old.attachments?.filter((att) => att.id !== data.attachmentId) ?? [],
          };
        },
      );

      return { previousTransaction };
    },
    onError: (error: Error, data, context) => {
      if (context?.previousTransaction) {
        queryClient.setQueryData(
          TRANSACTION_KEYS.detail(data.transactionId),
          context.previousTransaction,
        );
      }
      toast.error(error.message || 'Failed to delete attachment');
    },
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({ queryKey: TRANSACTION_KEYS.detail(variables.transactionId) });
      queryClient.invalidateQueries({ queryKey: TRANSACTION_KEYS.lists() });
    },
    onSuccess: () => {
      toast.success('Attachment deleted successfully');
    },
  });
}

// -- PREFETCH HOOKS --------------------------------------------------------

/**
 * Returns a function that prefetches a transaction by ID into the React Query cache.
 * Useful for hover-based prefetching to improve perceived navigation speed.
 *
 * @returns A prefetch function that accepts a transaction ID
 *
 * Cache behaviour:
 * - Data is cached for 30 seconds, consistent with useTransaction
 * - No-ops if the data is already fresh in cache
 */
export function usePrefetchTransaction() {
  const queryClient = useQueryClient();

  return (transactionId: string) => {
    queryClient.prefetchQuery({
      queryKey: TRANSACTION_KEYS.detail(transactionId),
      queryFn: async () => {
        const result = await getTransactionById(transactionId);
        if (!result.success) {
          throw new Error(result.error);
        }

        return result.data;
      },
      staleTime: 30 * 1000,
    });
  };
}
