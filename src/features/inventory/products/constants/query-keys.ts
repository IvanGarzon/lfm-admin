import type { ProductFilters } from '@/features/inventory/products/types';

// -- Query Keys -------------------------------------------------------------

export const PRODUCT_KEYS = {
  all: ['products'] as const,
  lists: () => [...PRODUCT_KEYS.all, 'list'] as const,
  list: (filters: ProductFilters) => [...PRODUCT_KEYS.lists(), { filters }] as const,
  details: () => [...PRODUCT_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...PRODUCT_KEYS.details(), id] as const,
  statistics: () => [...PRODUCT_KEYS.all, 'statistics'] as const,
  active: () => [...PRODUCT_KEYS.all, 'active'] as const
};
