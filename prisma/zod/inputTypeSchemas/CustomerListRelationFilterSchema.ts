import type { Prisma } from '@/prisma/client';

import { z } from 'zod';
import { CustomerWhereInputSchema } from './CustomerWhereInputSchema';

export const CustomerListRelationFilterSchema: z.ZodType<Prisma.CustomerListRelationFilter> = z.strictObject({
  every: z.lazy(() => CustomerWhereInputSchema).optional(),
  some: z.lazy(() => CustomerWhereInputSchema).optional(),
  none: z.lazy(() => CustomerWhereInputSchema).optional(),
});

export default CustomerListRelationFilterSchema;
