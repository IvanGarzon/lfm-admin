'use client';

import { useQueryStates } from 'nuqs';
import { searchParams } from '@/filters/vendors/vendors-filters';

/**
 * Hook to manage vendor filter state in the URL query string
 * Uses nuqs for URL state management
 */
export function useVendorQueryString() {
  return useQueryStates(searchParams, {
    history: 'push',
    shallow: false,
  });
}
