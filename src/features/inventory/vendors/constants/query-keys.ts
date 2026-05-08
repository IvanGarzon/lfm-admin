import type { VendorFilters } from '@/features/inventory/vendors/types';

// -- Query Keys -------------------------------------------------------------

export const VENDOR_KEYS = {
  all: ['vendors'] as const,
  lists: () => [...VENDOR_KEYS.all, 'list'] as const,
  list: (filters: VendorFilters) => [...VENDOR_KEYS.lists(), { filters }] as const,
  details: () => [...VENDOR_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...VENDOR_KEYS.details(), id] as const,
  statistics: () => [...VENDOR_KEYS.all, 'statistics'] as const,
  active: () => [...VENDOR_KEYS.all, 'active'] as const
};
