import { VendorStatusSchema, type VendorStatus } from '@/zod/schemas/enums/VendorStatus.schema';
import { getSortingStateParser } from '@/lib/parsers';
import { SORTABLE_VENDOR_COLUMNS } from '@/features/inventory/vendors/constants/sortable-columns';

import {
  createSearchParamsCache,
  parseAsInteger,
  parseAsString,
  parseAsStringEnum,
  parseAsArrayOf,
} from 'nuqs/server';

const sortableColumnIds = new Set(SORTABLE_VENDOR_COLUMNS);

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
  status: parseAsArrayOf(parseAsStringEnum<VendorStatus>(VendorStatusSchema.options)).withDefault(
    [],
  ),
  sort: getSortingStateParser(sortableColumnIds).withDefault([]),
};

export const searchParamsCache = createSearchParamsCache(searchParams);
export const vendorSearchParamsDefaults = getSearchParamsDefaults(searchParams);
