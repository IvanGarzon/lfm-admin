import {
  TransactionStatusSchema,
  type TransactionStatusType,
} from '@/zod/inputTypeSchemas/TransactionStatusSchema';
import {
  TransactionTypeSchema,
  type TransactionTypeType,
} from '@/zod/inputTypeSchemas/TransactionTypeSchema';
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
    parseAsStringEnum<TransactionTypeType>(TransactionTypeSchema.options),
  ).withDefault([]),
  status: parseAsArrayOf(
    parseAsStringEnum<TransactionStatusType>(TransactionStatusSchema.options),
  ).withDefault([]),
  sort: getSortingStateParser(sortableColumnIds).withDefault([]),
};

export const searchParamsCache = createSearchParamsCache(searchParams);
export const transactionSearchParamsDefaults = getSearchParamsDefaults(searchParams);
