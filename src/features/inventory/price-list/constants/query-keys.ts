import type { PriceListFilters } from '@/features/inventory/price-list/types';

export const PRICE_LIST_KEYS = {
  all: ['priceList'] as const,
  lists: () => [...PRICE_LIST_KEYS.all, 'list'] as const,
  list: (filters: PriceListFilters) => [...PRICE_LIST_KEYS.lists(), { filters }] as const,
  active: () => [...PRICE_LIST_KEYS.all, 'active'] as const,
  details: () => [...PRICE_LIST_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...PRICE_LIST_KEYS.details(), id] as const,
  costHistory: (id: string) => [...PRICE_LIST_KEYS.all, 'costHistory', id] as const
};
