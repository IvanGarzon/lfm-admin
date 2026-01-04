'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getTransactions,
  getTransactionById,
  getTransactionStatistics,
  createTransaction,
  updateTransaction,
  deleteTransaction,
} from '@/actions/transactions';
import { TransactionFilters } from '@/features/finances/transactions/types';
import type { CreateTransactionInput, UpdateTransactionInput } from '@/schemas/transactions';
import { toast } from 'sonner';

export const TRANSACTION_KEYS = {
  all: ['transactions'] as const,
  lists: () => [...TRANSACTION_KEYS.all, 'list'] as const,
  list: (filters: Partial<TransactionFilters>) =>
    [...TRANSACTION_KEYS.lists(), { filters }] as const,
  details: () => [...TRANSACTION_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...TRANSACTION_KEYS.details(), id] as const,
  statistics: () => [...TRANSACTION_KEYS.all, 'statistics'] as const,
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
    queryKey: TRANSACTION_KEYS.detail(id ?? ''),
    queryFn: async () => {
      if (!id) {
        throw new Error('Transaction ID is required');
      }
      const result = await getTransactionById(id);
      if (!result.success) {
        throw new Error(result.error);
      }

      return result.data;
    },
    enabled: Boolean(id),
  });
}

export function useTransactionStatistics(dateFilter?: { startDate?: Date; endDate?: Date }) {
  return useQuery({
    queryKey: [...TRANSACTION_KEYS.statistics(), dateFilter],
    queryFn: async () => {
      const result = await getTransactionStatistics(dateFilter);
      if (!result.success) {
        throw new Error(result.error);
      }

      return result.data;
    },
    staleTime: 60 * 1000,
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TRANSACTION_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: TRANSACTION_KEYS.statistics() });
      toast.success('Transaction created successfully');
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
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: TRANSACTION_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: TRANSACTION_KEYS.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: TRANSACTION_KEYS.statistics() });
      toast.success('Transaction updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update transaction');
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TRANSACTION_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: TRANSACTION_KEYS.statistics() });
      toast.success('Transaction deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete transaction');
    },
  });
}
