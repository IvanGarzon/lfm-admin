import { z } from 'zod';
import type { Prisma } from '@/prisma/client';
import { QuoteSelectSchema } from '../inputTypeSchemas/QuoteSelectSchema';
import { QuoteIncludeSchema } from '../inputTypeSchemas/QuoteIncludeSchema';

export const QuoteArgsSchema: z.ZodType<Prisma.QuoteDefaultArgs> = z.object({
  select: z.lazy(() => QuoteSelectSchema).optional(),
  include: z.lazy(() => QuoteIncludeSchema).optional(),
}).strict();

export default QuoteArgsSchema;
