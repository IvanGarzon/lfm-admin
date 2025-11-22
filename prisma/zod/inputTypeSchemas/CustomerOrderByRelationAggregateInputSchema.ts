import type { Prisma } from '@/prisma/client';

import { z } from 'zod';
import { SortOrderSchema } from './SortOrderSchema';

export const CustomerOrderByRelationAggregateInputSchema: z.ZodType<Prisma.CustomerOrderByRelationAggregateInput> = z.strictObject({
  _count: z.lazy(() => SortOrderSchema).optional(),
});

export default CustomerOrderByRelationAggregateInputSchema;
