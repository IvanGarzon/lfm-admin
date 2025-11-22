import type { Prisma } from '@/prisma/client';

import { z } from 'zod';
import { QuoteItemWhereInputSchema } from './QuoteItemWhereInputSchema';

export const QuoteItemListRelationFilterSchema: z.ZodType<Prisma.QuoteItemListRelationFilter> = z.strictObject({
  every: z.lazy(() => QuoteItemWhereInputSchema).optional(),
  some: z.lazy(() => QuoteItemWhereInputSchema).optional(),
  none: z.lazy(() => QuoteItemWhereInputSchema).optional(),
});

export default QuoteItemListRelationFilterSchema;
