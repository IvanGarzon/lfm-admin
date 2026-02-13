import { GenderSchema, type Gender } from '@/zod/schemas/enums/Gender.schema';
import {
  EmployeeStatusSchema,
  type EmployeeStatus,
} from '@/zod/schemas/enums/EmployeeStatus.schema';
import { getSortingStateParser } from '@/lib/parsers';
import { SORTABLE_EMPLOYEE_COLUMNS } from '@/features/staff/employees/constants/sortable-columns';

import {
  createSearchParamsCache,
  parseAsInteger,
  parseAsString,
  parseAsStringEnum,
  parseAsArrayOf,
} from 'nuqs/server';

const sortableColumnIds = new Set(SORTABLE_EMPLOYEE_COLUMNS);

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
  alphabet: parseAsString.withDefault(''),
  page: parseAsInteger.withDefault(1),
  perPage: parseAsInteger.withDefault(20),
  gender: parseAsArrayOf(parseAsStringEnum<Gender>(GenderSchema.options)).withDefault([]),
  status: parseAsArrayOf(
    parseAsStringEnum<EmployeeStatus>(EmployeeStatusSchema.options),
  ).withDefault([]),
  sort: getSortingStateParser(sortableColumnIds).withDefault([]),
};

export const searchParamsCache = createSearchParamsCache(searchParams);
export const employeeSearchParamsDefaults = getSearchParamsDefaults(searchParams);
