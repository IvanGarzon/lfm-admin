import type { Prisma } from '@/prisma/client';

import { z } from 'zod';
import { QuoteStatusSchema } from './QuoteStatusSchema';
import { NestedIntFilterSchema } from './NestedIntFilterSchema';
import { NestedEnumQuoteStatusFilterSchema } from './NestedEnumQuoteStatusFilterSchema';

export const NestedEnumQuoteStatusWithAggregatesFilterSchema: z.ZodType<Prisma.NestedEnumQuoteStatusWithAggregatesFilter> = z.strictObject({
  equals: z.lazy(() => QuoteStatusSchema).optional(),
  in: z.lazy(() => QuoteStatusSchema).array().optional(),
  notIn: z.lazy(() => QuoteStatusSchema).array().optional(),
  not: z.union([ z.lazy(() => QuoteStatusSchema), z.lazy(() => NestedEnumQuoteStatusWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedEnumQuoteStatusFilterSchema).optional(),
  _max: z.lazy(() => NestedEnumQuoteStatusFilterSchema).optional(),
});

export default NestedEnumQuoteStatusWithAggregatesFilterSchema;
