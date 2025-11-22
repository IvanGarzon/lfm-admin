import { z } from 'zod';
import type { Prisma } from '@/prisma/client';
import { QuoteItemWhereInputSchema } from '../inputTypeSchemas/QuoteItemWhereInputSchema'
import { QuoteItemOrderByWithRelationInputSchema } from '../inputTypeSchemas/QuoteItemOrderByWithRelationInputSchema'
import { QuoteItemWhereUniqueInputSchema } from '../inputTypeSchemas/QuoteItemWhereUniqueInputSchema'

export const QuoteItemAggregateArgsSchema: z.ZodType<Prisma.QuoteItemAggregateArgs> = z.object({
  where: QuoteItemWhereInputSchema.optional(), 
  orderBy: z.union([ QuoteItemOrderByWithRelationInputSchema.array(), QuoteItemOrderByWithRelationInputSchema ]).optional(),
  cursor: QuoteItemWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export default QuoteItemAggregateArgsSchema;
