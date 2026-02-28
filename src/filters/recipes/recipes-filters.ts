import { getSortingStateParser } from '@/lib/parsers';
import { SORTABLE_RECIPE_COLUMNS } from '@/features/finances/recipes/constants/sortable-columns';

import { createSearchParamsCache, parseAsInteger, parseAsString } from 'nuqs/server';

const sortableColumnIds = new Set(SORTABLE_RECIPE_COLUMNS);

type ExtractDefaults<T extends Record<string, { defaultValue: unknown }>> = {
  [K in keyof T]: T[K]['defaultValue'];
};

export function getSearchParamsDefaults<T extends Record<string, { defaultValue: unknown }>>(
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
  sort: getSortingStateParser(sortableColumnIds).withDefault([]),
};

export const searchParamsCache = createSearchParamsCache(searchParams);
export const recipeSearchParamsDefaults = getSearchParamsDefaults(searchParams);
