'use client';

import { useQueryString } from '@/hooks/use-query-string';
import {
  searchParams,
  priceListSearchParamsDefaults,
} from '@/filters/price-list/price-list-filters';

export function usePriceListHref(id: string): string {
  const queryString = useQueryString(searchParams, priceListSearchParamsDefaults);
  const basePath = `/inventory/price-list/${id}`;
  return queryString ? `${basePath}?${queryString}` : basePath;
}
