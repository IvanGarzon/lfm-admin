'use client';

import { useQueryString } from '@/hooks/use-query-string';
import { searchParams, productSearchParamsDefaults } from '@/filters/products/products-filters';

export function useProductHref(productId: string): string {
  const queryString = useQueryString(searchParams, productSearchParamsDefaults);
  const basePath = `/inventory/products/${productId}`;
  return queryString ? `${basePath}?${queryString}` : basePath;
}
