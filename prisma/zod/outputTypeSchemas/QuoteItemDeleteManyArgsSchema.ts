import { z } from 'zod';
import type { Prisma } from '@/prisma/client';
import { QuoteItemWhereInputSchema } from '../inputTypeSchemas/QuoteItemWhereInputSchema'

export const QuoteItemDeleteManyArgsSchema: z.ZodType<Prisma.QuoteItemDeleteManyArgs> = z.object({
  where: QuoteItemWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export default QuoteItemDeleteManyArgsSchema;
