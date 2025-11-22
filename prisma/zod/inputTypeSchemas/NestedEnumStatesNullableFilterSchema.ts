import type { Prisma } from '@/prisma/client';

import { z } from 'zod';
import { StatesSchema } from './StatesSchema';

export const NestedEnumStatesNullableFilterSchema: z.ZodType<Prisma.NestedEnumStatesNullableFilter> = z.strictObject({
  equals: z.lazy(() => StatesSchema).optional().nullable(),
  in: z.lazy(() => StatesSchema).array().optional().nullable(),
  notIn: z.lazy(() => StatesSchema).array().optional().nullable(),
  not: z.union([ z.lazy(() => StatesSchema), z.lazy(() => NestedEnumStatesNullableFilterSchema) ]).optional().nullable(),
});

export default NestedEnumStatesNullableFilterSchema;
