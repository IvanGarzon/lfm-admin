import type { Prisma } from '@/prisma/client';

import { z } from 'zod';
import { QuoteItemWhereInputSchema } from './QuoteItemWhereInputSchema';

export const QuoteItemScalarRelationFilterSchema: z.ZodType<Prisma.QuoteItemScalarRelationFilter> = z.strictObject({
  is: z.lazy(() => QuoteItemWhereInputSchema).optional(),
  isNot: z.lazy(() => QuoteItemWhereInputSchema).optional(),
});

export default QuoteItemScalarRelationFilterSchema;
