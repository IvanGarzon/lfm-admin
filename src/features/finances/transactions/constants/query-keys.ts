import type { TransactionFilters } from '@/features/finances/transactions/types';

export const TRANSACTION_KEYS = {
  all: ['transactions'] as const,
  lists: () => [...TRANSACTION_KEYS.all, 'list'] as const,
  list: (filters: TransactionFilters) => [...TRANSACTION_KEYS.lists(), { filters }] as const,
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
  topCategories: (limit?: number) => [...TRANSACTION_KEYS.analytics(), 'top', { limit }] as const
};
