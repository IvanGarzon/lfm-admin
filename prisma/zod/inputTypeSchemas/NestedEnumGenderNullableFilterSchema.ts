import type { Prisma } from '@/prisma/client';

import { z } from 'zod';
import { GenderSchema } from './GenderSchema';

export const NestedEnumGenderNullableFilterSchema: z.ZodType<Prisma.NestedEnumGenderNullableFilter> = z.strictObject({
  equals: z.lazy(() => GenderSchema).optional().nullable(),
  in: z.lazy(() => GenderSchema).array().optional().nullable(),
  notIn: z.lazy(() => GenderSchema).array().optional().nullable(),
  not: z.union([ z.lazy(() => GenderSchema), z.lazy(() => NestedEnumGenderNullableFilterSchema) ]).optional().nullable(),
});

export default NestedEnumGenderNullableFilterSchema;
