import { getSortingStateParser } from '@/lib/parsers';
import { SORTABLE_PRICE_LIST_COLUMNS } from '@/features/inventory/price-list/constants/sortable-columns';
import { PRICE_LIST_CATEGORIES } from '@/features/inventory/price-list/constants/categories';
import {
  createSearchParamsCache,
  parseAsInteger,
  parseAsString,
  parseAsArrayOf,
  parseAsStringEnum,
} from 'nuqs/server';
import type { PriceListCategory } from '@/features/inventory/price-list/constants/categories';

const sortableColumnIds = new Set<string>(SORTABLE_PRICE_LIST_COLUMNS);

type ExtractDefaults<T extends Record<string, { defaultValue: unknown }>> = {
  [K in keyof T]: T[K]['defaultValue'];
};

function getSearchParamsDefaults<T extends Record<string, { defaultValue: unknown }>>(
  params: T,
): ExtractDefaults<T> {
  return Object.fromEntries(
    Object.entries(params).map(([key, parser]) => [key, parser.defaultValue]),
  ) as ExtractDefaults<T>;
}

export const searchParams = {
  search: parseAsString.withDefault(''),
  page: parseAsInteger.withDefault(1),
  perPage: parseAsInteger.withDefault(20),
  category: parseAsArrayOf(
    parseAsStringEnum<PriceListCategory>([...PRICE_LIST_CATEGORIES]),
  ).withDefault([]),
  sort: getSortingStateParser(sortableColumnIds).withDefault([]),
};

export const searchParamsCache = createSearchParamsCache(searchParams);
export const priceListSearchParamsDefaults = getSearchParamsDefaults(searchParams);
