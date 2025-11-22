import type { Prisma } from '@/prisma/client';

import { z } from 'zod';
import { QuoteWhereInputSchema } from './QuoteWhereInputSchema';

export const QuoteScalarRelationFilterSchema: z.ZodType<Prisma.QuoteScalarRelationFilter> = z.strictObject({
  is: z.lazy(() => QuoteWhereInputSchema).optional(),
  isNot: z.lazy(() => QuoteWhereInputSchema).optional(),
});

export default QuoteScalarRelationFilterSchema;
