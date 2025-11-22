import type { Prisma } from '@/prisma/client';

import { z } from 'zod';
import { SortOrderSchema } from './SortOrderSchema';

export const QuoteItemOrderByRelationAggregateInputSchema: z.ZodType<Prisma.QuoteItemOrderByRelationAggregateInput> = z.strictObject({
  _count: z.lazy(() => SortOrderSchema).optional(),
});

export default QuoteItemOrderByRelationAggregateInputSchema;
