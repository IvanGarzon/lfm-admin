import {
  TransactionStatusSchema,
  type TransactionStatus,
} from '@/zod/schemas/enums/TransactionStatus.schema';
import {
  TransactionTypeSchema,
  type TransactionType,
} from '@/zod/schemas/enums/TransactionType.schema';
import { getSortingStateParser } from '@/lib/parsers';
import { SORTABLE_TRANSACTION_COLUMNS } from '@/features/finances/transactions/constants/sortable-columns';

import {
  createSearchParamsCache,
  parseAsInteger,
  parseAsString,
  parseAsStringEnum,
  parseAsArrayOf,
} from 'nuqs/server';

const sortableColumnIds = new Set(SORTABLE_TRANSACTION_COLUMNS);

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
  type: parseAsArrayOf(
    parseAsStringEnum<TransactionType>(TransactionTypeSchema.options),
  ).withDefault([]),
  status: parseAsArrayOf(
    parseAsStringEnum<TransactionStatus>(TransactionStatusSchema.options),
  ).withDefault([]),
  sort: getSortingStateParser(sortableColumnIds).withDefault([]),
};

export const searchParamsCache = createSearchParamsCache(searchParams);
export const transactionSearchParamsDefaults = getSearchParamsDefaults(searchParams);
