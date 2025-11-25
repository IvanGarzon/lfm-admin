import type { Prisma } from '@/prisma/client';

import { z } from 'zod';
import { SortOrderSchema } from './SortOrderSchema';

export const QuoteAvgOrderByAggregateInputSchema: z.ZodType<Prisma.QuoteAvgOrderByAggregateInput> = z.strictObject({
  versionNumber: z.lazy(() => SortOrderSchema).optional(),
  amount: z.lazy(() => SortOrderSchema).optional(),
  gst: z.lazy(() => SortOrderSchema).optional(),
  discount: z.lazy(() => SortOrderSchema).optional(),
});

export default QuoteAvgOrderByAggregateInputSchema;
