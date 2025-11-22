import type { Prisma } from '@/prisma/client';

import { z } from 'zod';
import { CustomerStatusSchema } from './CustomerStatusSchema';

export const NestedEnumCustomerStatusFilterSchema: z.ZodType<Prisma.NestedEnumCustomerStatusFilter> = z.strictObject({
  equals: z.lazy(() => CustomerStatusSchema).optional(),
  in: z.lazy(() => CustomerStatusSchema).array().optional(),
  notIn: z.lazy(() => CustomerStatusSchema).array().optional(),
  not: z.union([ z.lazy(() => CustomerStatusSchema), z.lazy(() => NestedEnumCustomerStatusFilterSchema) ]).optional(),
});

export default NestedEnumCustomerStatusFilterSchema;
