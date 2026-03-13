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
  createTransaction,
  updateTransaction,
  deleteTransaction,
  uploadTransactionAttachment,
  deleteTransactionAttachment,
} from '@/actions/finances/transactions';
import {
  TransactionFilters,
  type TransactionListItem,
} from '@/features/finances/transactions/types';
import type { CreateTransactionInput, UpdateTransactionInput } from '@/schemas/transactions';
import { formatDateNormalizer } from '@/lib/utils';

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

export function useTransactions(filters: Partial<TransactionFilters> = {}) {
  return useQuery({
    queryKey: TRANSACTION_KEYS.list(filters),
    queryFn: async () => {
      const searchParams: Record<string, string | string[]> = {};

      if (filters.search) {
        searchParams.search = filters.search;
      }

      if (filters.type) {
        searchParams.type = filters.type;
      }

      if (filters.status && filters.status.length > 0) {
        searchParams.status = filters.status;
      }

      // if (filters.startDate) {
      //   searchParams.startDate = filters.startDate.toISOString();
      // }

      // if (filters.endDate) {
      //   searchParams.endDate = filters.endDate.toISOString();
      // }

      // if (filters.minAmount !== undefined) {
      //   searchParams.minAmount = String(filters.minAmount);
      // }

      // if (filters.maxAmount !== undefined) {
      //   searchParams.maxAmount = String(filters.maxAmount);
      // }

      if (filters.page) {
        searchParams.page = String(filters.page);
      }

      if (filters.perPage) {
        searchParams.perPage = String(filters.perPage);
      }

      const result = await getTransactions(searchParams);
      if (!result.success) {
        throw new Error(result.error);
      }

      return result.data;
    },
    staleTime: 30 * 1000,
  });
}

export function useTransaction(id: string | undefined) {
  return useQuery({
    queryKey: TRANSACTION_KEYS.detail(id ?? ''), // Keep for type safety
    queryFn: id
      ? async () => {
          const result = await getTransactionById(id);
          if (!result.success) {
            throw new Error(result.error);
          }

          return result.data;
        }
      : skipToken,
    staleTime: 30 * 1000, // 30 seconds
  });
}

export function useTransactionCategories() {
  return useQuery({
    queryKey: TRANSACTION_KEYS.categories(),
    queryFn: async () => {
      const result = await getTransactionCategories();
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data ?? [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - categories don't change often
  });
}

export function useTransactionStatistics(
  dateFilter?: { startDate?: Date; endDate?: Date },
  options?: { enabled?: boolean },
) {
  // Normalize date filter to ISO date strings for stable query keys
  // This prevents cache misses when component remounts with logically identical dates
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
    staleTime: 60 * 1000, // 1 minute
    placeholderData: keepPreviousData,
    enabled: options?.enabled,
  });
}

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
      // Cancel any outgoing refetches to prevent race conditions
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
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: TRANSACTION_KEYS.detail(newData.id) });
      await queryClient.cancelQueries({ queryKey: TRANSACTION_KEYS.lists() });

      // Snapshot the previous value
      const previousTransaction = queryClient.getQueryData(TRANSACTION_KEYS.detail(newData.id));

      // Optimistically update transaction with new data
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
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousTransaction) {
        queryClient.setQueryData(TRANSACTION_KEYS.detail(newData.id), context.previousTransaction);
      }
      toast.error(err.message || 'Failed to update transaction');
    },
    onSettled: (_data, _error, variables) => {
      // Always refetch after error or success to ensure cache consistency
      queryClient.invalidateQueries({ queryKey: TRANSACTION_KEYS.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: TRANSACTION_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: TRANSACTION_KEYS.statistics() });
    },
    onSuccess: () => {
      toast.success('Transaction updated successfully');
    },
  });
}

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
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: TRANSACTION_KEYS.detail(id) });
      await queryClient.cancelQueries({ queryKey: TRANSACTION_KEYS.lists() });

      // Snapshot the previous values
      const previousTransaction = queryClient.getQueryData(TRANSACTION_KEYS.detail(id));
      const previousLists = queryClient.getQueriesData({ queryKey: TRANSACTION_KEYS.lists() });

      // Optimistically remove from detail cache
      queryClient.removeQueries({ queryKey: TRANSACTION_KEYS.detail(id) });

      // Return context for rollback
      return { previousTransaction, previousLists, id };
    },
    onError: (error: Error, id, context) => {
      // Rollback optimistic update
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
      // Always refetch to ensure cache consistency
      queryClient.invalidateQueries({ queryKey: TRANSACTION_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: TRANSACTION_KEYS.statistics() });
    },
    onSuccess: () => {
      toast.success('Transaction deleted successfully');
    },
  });
}

export function useUploadTransactionAttachment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { transactionId: string; file: File }) => {
      const formData = new FormData();
      formData.append('file', data.file);

      const result = await uploadTransactionAttachment(data.transactionId, formData);
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
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: TRANSACTION_KEYS.detail(data.transactionId) });
      await queryClient.cancelQueries({ queryKey: TRANSACTION_KEYS.lists() });

      // Snapshot the previous values
      const previousTransaction = queryClient.getQueryData(
        TRANSACTION_KEYS.detail(data.transactionId),
      );

      // Optimistically remove attachment from transaction detail
      queryClient.setQueryData(
        TRANSACTION_KEYS.detail(data.transactionId),
        (old: TransactionListItem | undefined) => {
          if (!old) return old;
          return {
            ...old,
            attachments: old.attachments?.filter((att) => att.id !== data.attachmentId) || [],
          };
        },
      );

      return { previousTransaction };
    },
    onError: (error: Error, data, context) => {
      // Rollback optimistic update
      if (context?.previousTransaction) {
        queryClient.setQueryData(
          TRANSACTION_KEYS.detail(data.transactionId),
          context.previousTransaction,
        );
      }
      toast.error(error.message || 'Failed to delete attachment');
    },
    onSettled: (_data, _error, variables) => {
      // Always refetch to ensure cache consistency
      queryClient.invalidateQueries({ queryKey: TRANSACTION_KEYS.detail(variables.transactionId) });
      queryClient.invalidateQueries({ queryKey: TRANSACTION_KEYS.lists() });
    },
    onSuccess: () => {
      toast.success('Attachment deleted successfully');
    },
  });
}

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
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useCategoryBreakdown(dateFilter?: { startDate?: Date; endDate?: Date }) {
  // Normalize date filter to ISO date strings for stable query keys
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
    staleTime: 5 * 60 * 1000, // 5 minutes
    placeholderData: keepPreviousData,
  });
}

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
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function usePrefetchTransaction() {
  const queryClient = useQueryClient();

  return (transactionId: string) => {
    queryClient.prefetchQuery({
      queryKey: TRANSACTION_KEYS.detail(transactionId),
      queryFn: async () => {
        const result = await getTransactionById(transactionId);
        if (!result.success) throw new Error(result.error);
        return result.data;
      },
      staleTime: 30 * 1000,
    });
  };
}
