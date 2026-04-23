'use client';

import { useQueryString } from '@/hooks/use-query-string';
import { searchParams, vendorSearchParamsDefaults } from '@/filters/vendors/vendors-filters';

export function useVendorHref(id: string): string {
  const queryString = useQueryString(searchParams, vendorSearchParamsDefaults);
  const basePath = `/inventory/vendors/${id}`;
  return queryString ? `${basePath}?${queryString}` : basePath;
}
