import type { Prisma } from '@/prisma/client';

import { z } from 'zod';
import { CustomerWhereInputSchema } from './CustomerWhereInputSchema';

export const CustomerScalarRelationFilterSchema: z.ZodType<Prisma.CustomerScalarRelationFilter> = z.strictObject({
  is: z.lazy(() => CustomerWhereInputSchema).optional(),
  isNot: z.lazy(() => CustomerWhereInputSchema).optional(),
});

export default CustomerScalarRelationFilterSchema;
