import { z } from 'zod';
import type { Prisma } from '@/prisma/client';
import { QuoteItemSelectSchema } from '../inputTypeSchemas/QuoteItemSelectSchema';
import { QuoteItemIncludeSchema } from '../inputTypeSchemas/QuoteItemIncludeSchema';

export const QuoteItemArgsSchema: z.ZodType<Prisma.QuoteItemDefaultArgs> = z.object({
  select: z.lazy(() => QuoteItemSelectSchema).optional(),
  include: z.lazy(() => QuoteItemIncludeSchema).optional(),
}).strict();

export default QuoteItemArgsSchema;
