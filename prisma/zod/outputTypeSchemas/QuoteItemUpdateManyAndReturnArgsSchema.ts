import { z } from 'zod';
import type { Prisma } from '@/prisma/client';
import { QuoteItemUpdateManyMutationInputSchema } from '../inputTypeSchemas/QuoteItemUpdateManyMutationInputSchema'
import { QuoteItemUncheckedUpdateManyInputSchema } from '../inputTypeSchemas/QuoteItemUncheckedUpdateManyInputSchema'
import { QuoteItemWhereInputSchema } from '../inputTypeSchemas/QuoteItemWhereInputSchema'

export const QuoteItemUpdateManyAndReturnArgsSchema: z.ZodType<Prisma.QuoteItemUpdateManyAndReturnArgs> = z.object({
  data: z.union([ QuoteItemUpdateManyMutationInputSchema, QuoteItemUncheckedUpdateManyInputSchema ]),
  where: QuoteItemWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export default QuoteItemUpdateManyAndReturnArgsSchema;
