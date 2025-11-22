import type { Prisma } from '@/prisma/client';

import { z } from 'zod';
import { QuoteWhereInputSchema } from './QuoteWhereInputSchema';

export const QuoteListRelationFilterSchema: z.ZodType<Prisma.QuoteListRelationFilter> = z.strictObject({
  every: z.lazy(() => QuoteWhereInputSchema).optional(),
  some: z.lazy(() => QuoteWhereInputSchema).optional(),
  none: z.lazy(() => QuoteWhereInputSchema).optional(),
});

export default QuoteListRelationFilterSchema;
