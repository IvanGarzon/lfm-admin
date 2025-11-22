import type { Prisma } from '@/prisma/client';

import { z } from 'zod';
import { CustomerStatusSchema } from './CustomerStatusSchema';
import { NestedEnumCustomerStatusFilterSchema } from './NestedEnumCustomerStatusFilterSchema';

export const EnumCustomerStatusFilterSchema: z.ZodType<Prisma.EnumCustomerStatusFilter> = z.strictObject({
  equals: z.lazy(() => CustomerStatusSchema).optional(),
  in: z.lazy(() => CustomerStatusSchema).array().optional(),
  notIn: z.lazy(() => CustomerStatusSchema).array().optional(),
  not: z.union([ z.lazy(() => CustomerStatusSchema), z.lazy(() => NestedEnumCustomerStatusFilterSchema) ]).optional(),
});

export default EnumCustomerStatusFilterSchema;
