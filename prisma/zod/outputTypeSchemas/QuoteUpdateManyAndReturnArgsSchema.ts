import { z } from 'zod';
import type { Prisma } from '@/prisma/client';
import { QuoteUpdateManyMutationInputSchema } from '../inputTypeSchemas/QuoteUpdateManyMutationInputSchema'
import { QuoteUncheckedUpdateManyInputSchema } from '../inputTypeSchemas/QuoteUncheckedUpdateManyInputSchema'
import { QuoteWhereInputSchema } from '../inputTypeSchemas/QuoteWhereInputSchema'

export const QuoteUpdateManyAndReturnArgsSchema: z.ZodType<Prisma.QuoteUpdateManyAndReturnArgs> = z.object({
  data: z.union([ QuoteUpdateManyMutationInputSchema, QuoteUncheckedUpdateManyInputSchema ]),
  where: QuoteWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export default QuoteUpdateManyAndReturnArgsSchema;
