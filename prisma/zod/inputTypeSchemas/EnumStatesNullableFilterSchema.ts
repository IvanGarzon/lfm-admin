import type { Prisma } from '@/prisma/client';

import { z } from 'zod';
import { StatesSchema } from './StatesSchema';
import { NestedEnumStatesNullableFilterSchema } from './NestedEnumStatesNullableFilterSchema';

export const EnumStatesNullableFilterSchema: z.ZodType<Prisma.EnumStatesNullableFilter> = z.strictObject({
  equals: z.lazy(() => StatesSchema).optional().nullable(),
  in: z.lazy(() => StatesSchema).array().optional().nullable(),
  notIn: z.lazy(() => StatesSchema).array().optional().nullable(),
  not: z.union([ z.lazy(() => StatesSchema), z.lazy(() => NestedEnumStatesNullableFilterSchema) ]).optional().nullable(),
});

export default EnumStatesNullableFilterSchema;
