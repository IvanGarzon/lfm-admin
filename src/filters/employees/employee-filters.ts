import { GenderSchema, type GenderType } from '@/zod/inputTypeSchemas/GenderSchema';
import {
  EmployeeStatusSchema,
  type EmployeeStatusType,
} from '@/zod/inputTypeSchemas/EmployeeStatusSchema';

import {
  createSearchParamsCache,
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
  parseAsStringEnum,
} from 'nuqs/server';

export const searchParams = {
  search: parseAsString.withDefault(''),
  alphabet: parseAsString.withDefault(''),
  page: parseAsInteger.withDefault(1),
  perPage: parseAsInteger.withDefault(20),
  gender: parseAsStringEnum<GenderType>(GenderSchema.options),
  status: parseAsStringEnum<EmployeeStatusType>(EmployeeStatusSchema.options),
  sortBy: parseAsStringLiteral(['asc', 'desc'] as const).withDefault('asc'),
};

export const searchParamsCache = createSearchParamsCache(searchParams);
