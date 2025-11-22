import type { Prisma } from '@/prisma/client';

import { z } from 'zod';
import { CustomerStatusSchema } from './CustomerStatusSchema';
import { NestedEnumCustomerStatusWithAggregatesFilterSchema } from './NestedEnumCustomerStatusWithAggregatesFilterSchema';
import { NestedIntFilterSchema } from './NestedIntFilterSchema';
import { NestedEnumCustomerStatusFilterSchema } from './NestedEnumCustomerStatusFilterSchema';

export const EnumCustomerStatusWithAggregatesFilterSchema: z.ZodType<Prisma.EnumCustomerStatusWithAggregatesFilter> = z.strictObject({
  equals: z.lazy(() => CustomerStatusSchema).optional(),
  in: z.lazy(() => CustomerStatusSchema).array().optional(),
  notIn: z.lazy(() => CustomerStatusSchema).array().optional(),
  not: z.union([ z.lazy(() => CustomerStatusSchema), z.lazy(() => NestedEnumCustomerStatusWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedEnumCustomerStatusFilterSchema).optional(),
  _max: z.lazy(() => NestedEnumCustomerStatusFilterSchema).optional(),
});

export default EnumCustomerStatusWithAggregatesFilterSchema;
