import type { Prisma } from '@/prisma/client';

import { z } from 'zod';
import { ProductStatusSchema } from './ProductStatusSchema';

export const NestedEnumProductStatusFilterSchema: z.ZodType<Prisma.NestedEnumProductStatusFilter> = z.strictObject({
  equals: z.lazy(() => ProductStatusSchema).optional(),
  in: z.lazy(() => ProductStatusSchema).array().optional(),
  notIn: z.lazy(() => ProductStatusSchema).array().optional(),
  not: z.union([ z.lazy(() => ProductStatusSchema), z.lazy(() => NestedEnumProductStatusFilterSchema) ]).optional(),
});

export default NestedEnumProductStatusFilterSchema;
