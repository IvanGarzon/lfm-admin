import type { Prisma } from '@/prisma/client';

import { z } from 'zod';
import { QuoteStatusSchema } from './QuoteStatusSchema';
import { NestedEnumQuoteStatusFilterSchema } from './NestedEnumQuoteStatusFilterSchema';

export const EnumQuoteStatusFilterSchema: z.ZodType<Prisma.EnumQuoteStatusFilter> = z.strictObject({
  equals: z.lazy(() => QuoteStatusSchema).optional(),
  in: z.lazy(() => QuoteStatusSchema).array().optional(),
  notIn: z.lazy(() => QuoteStatusSchema).array().optional(),
  not: z.union([ z.lazy(() => QuoteStatusSchema), z.lazy(() => NestedEnumQuoteStatusFilterSchema) ]).optional(),
});

export default EnumQuoteStatusFilterSchema;
