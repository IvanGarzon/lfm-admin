import type { Prisma } from '@/prisma/client';

import { z } from 'zod';
import { QuoteStatusSchema } from './QuoteStatusSchema';

export const NestedEnumQuoteStatusFilterSchema: z.ZodType<Prisma.NestedEnumQuoteStatusFilter> = z.strictObject({
  equals: z.lazy(() => QuoteStatusSchema).optional(),
  in: z.lazy(() => QuoteStatusSchema).array().optional(),
  notIn: z.lazy(() => QuoteStatusSchema).array().optional(),
  not: z.union([ z.lazy(() => QuoteStatusSchema), z.lazy(() => NestedEnumQuoteStatusFilterSchema) ]).optional(),
});

export default NestedEnumQuoteStatusFilterSchema;
