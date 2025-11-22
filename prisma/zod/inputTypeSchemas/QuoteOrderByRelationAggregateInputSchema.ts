import type { Prisma } from '@/prisma/client';

import { z } from 'zod';
import { SortOrderSchema } from './SortOrderSchema';

export const QuoteOrderByRelationAggregateInputSchema: z.ZodType<Prisma.QuoteOrderByRelationAggregateInput> = z.strictObject({
  _count: z.lazy(() => SortOrderSchema).optional(),
});

export default QuoteOrderByRelationAggregateInputSchema;
