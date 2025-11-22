import type { Prisma } from '@/prisma/client';

import { z } from 'zod';
import { GenderSchema } from './GenderSchema';
import { NestedEnumGenderNullableFilterSchema } from './NestedEnumGenderNullableFilterSchema';

export const EnumGenderNullableFilterSchema: z.ZodType<Prisma.EnumGenderNullableFilter> = z.strictObject({
  equals: z.lazy(() => GenderSchema).optional().nullable(),
  in: z.lazy(() => GenderSchema).array().optional().nullable(),
  notIn: z.lazy(() => GenderSchema).array().optional().nullable(),
  not: z.union([ z.lazy(() => GenderSchema), z.lazy(() => NestedEnumGenderNullableFilterSchema) ]).optional().nullable(),
});

export default EnumGenderNullableFilterSchema;
