import { ProductStatusSchema } from '@/zod/schemas/enums/ProductStatus.schema';
import { getSortingStateParser } from '@/lib/parsers';
import { SORTABLE_PRODUCT_COLUMNS } from '@/features/inventory/products/constants/sortable-columns';
import {
  createSearchParamsCache,
  parseAsInteger,
  parseAsString,
  parseAsArrayOf,
  parseAsStringEnum,
} from 'nuqs/server';
import type { ProductStatus } from '@/prisma/client';

const sortableColumnIds = new Set<string>(SORTABLE_PRODUCT_COLUMNS);

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
  status: parseAsArrayOf(parseAsStringEnum<ProductStatus>(ProductStatusSchema.options)).withDefault(
    [],
  ),
  sort: getSortingStateParser(sortableColumnIds).withDefault([]),
};

export const searchParamsCache = createSearchParamsCache(searchParams);
export const productSearchParamsDefaults = getSearchParamsDefaults(searchParams);
