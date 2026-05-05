import type { QuoteFilters } from '@/features/finances/quotes/types';

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
    avgTimeToDecision: () => [...QUOTE_KEYS.analytics.all(), 'avg-time-to-decision'] as const
  }
};
