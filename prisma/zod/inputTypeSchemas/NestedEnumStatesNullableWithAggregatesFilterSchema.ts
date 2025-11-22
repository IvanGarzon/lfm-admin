import type { Prisma } from '@/prisma/client';

import { z } from 'zod';
import { StatesSchema } from './StatesSchema';
import { NestedIntNullableFilterSchema } from './NestedIntNullableFilterSchema';
import { NestedEnumStatesNullableFilterSchema } from './NestedEnumStatesNullableFilterSchema';

export const NestedEnumStatesNullableWithAggregatesFilterSchema: z.ZodType<Prisma.NestedEnumStatesNullableWithAggregatesFilter> = z.strictObject({
  equals: z.lazy(() => StatesSchema).optional().nullable(),
  in: z.lazy(() => StatesSchema).array().optional().nullable(),
  notIn: z.lazy(() => StatesSchema).array().optional().nullable(),
  not: z.union([ z.lazy(() => StatesSchema), z.lazy(() => NestedEnumStatesNullableWithAggregatesFilterSchema) ]).optional().nullable(),
  _count: z.lazy(() => NestedIntNullableFilterSchema).optional(),
  _min: z.lazy(() => NestedEnumStatesNullableFilterSchema).optional(),
  _max: z.lazy(() => NestedEnumStatesNullableFilterSchema).optional(),
});

export default NestedEnumStatesNullableWithAggregatesFilterSchema;
