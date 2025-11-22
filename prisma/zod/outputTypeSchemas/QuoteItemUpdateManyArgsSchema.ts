import { z } from 'zod';
import type { Prisma } from '@/prisma/client';
import { QuoteItemUpdateManyMutationInputSchema } from '../inputTypeSchemas/QuoteItemUpdateManyMutationInputSchema'
import { QuoteItemUncheckedUpdateManyInputSchema } from '../inputTypeSchemas/QuoteItemUncheckedUpdateManyInputSchema'
import { QuoteItemWhereInputSchema } from '../inputTypeSchemas/QuoteItemWhereInputSchema'

export const QuoteItemUpdateManyArgsSchema: z.ZodType<Prisma.QuoteItemUpdateManyArgs> = z.object({
  data: z.union([ QuoteItemUpdateManyMutationInputSchema, QuoteItemUncheckedUpdateManyInputSchema ]),
  where: QuoteItemWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export default QuoteItemUpdateManyArgsSchema;
