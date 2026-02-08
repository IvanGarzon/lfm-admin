import {
  OrganizationStatusSchema,
  type OrganizationStatus,
} from '@/zod/schemas/enums/OrganizationStatus.schema';
import { getSortingStateParser } from '@/lib/parsers';
import { sanitizeSearchQuery, validatePaginationParams } from '@/lib/validation';

import {
  createSearchParamsCache,
  parseAsInteger,
  parseAsString,
  parseAsStringEnum,
  parseAsArrayOf,
} from 'nuqs/server';

import { SORTABLE_ORGANIZATION_COLUMNS } from '@/features/organizations/constants/sortable-columns';

const sortableColumnIds = new Set(SORTABLE_ORGANIZATION_COLUMNS);

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
  name: parseAsString.withDefault(''),
  page: parseAsInteger.withDefault(1),
  perPage: parseAsInteger.withDefault(20),
  status: parseAsArrayOf(
    parseAsStringEnum<OrganizationStatus>(OrganizationStatusSchema.options),
  ).withDefault([]),
  sort: getSortingStateParser(sortableColumnIds).withDefault([]),
};

export const searchParamsCache = createSearchParamsCache(searchParams);
export const organizationSearchParamsDefaults = getSearchParamsDefaults(searchParams);

/**
 * Validates and sanitizes organization search parameters
 * - Sanitizes search query to prevent injection attacks
 * - Validates pagination parameters are within acceptable ranges
 * - Ensures status values are from allowed enum
 */
export function validateOrganizationSearchParams(
  params: Awaited<ReturnType<typeof searchParamsCache.parse>>,
) {
  const { page, perPage } = validatePaginationParams(params.page, params.perPage);

  return {
    name: sanitizeSearchQuery(params.name),
    page,
    perPage,
    status: params.status, // Already validated by parseAsStringEnum
    sort: params.sort, // Already validated by getSortingStateParser
  };
}
