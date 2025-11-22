import { z } from 'zod';
import type { Prisma } from '@/prisma/client';
import { QuoteItemCreateManyInputSchema } from '../inputTypeSchemas/QuoteItemCreateManyInputSchema'

export const QuoteItemCreateManyArgsSchema: z.ZodType<Prisma.QuoteItemCreateManyArgs> = z.object({
  data: z.union([ QuoteItemCreateManyInputSchema, QuoteItemCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export default QuoteItemCreateManyArgsSchema;
