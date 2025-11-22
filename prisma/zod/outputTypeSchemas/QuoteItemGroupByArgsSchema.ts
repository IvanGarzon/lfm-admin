import { z } from 'zod';
import type { Prisma } from '@/prisma/client';
import { QuoteItemWhereInputSchema } from '../inputTypeSchemas/QuoteItemWhereInputSchema'
import { QuoteItemOrderByWithAggregationInputSchema } from '../inputTypeSchemas/QuoteItemOrderByWithAggregationInputSchema'
import { QuoteItemScalarFieldEnumSchema } from '../inputTypeSchemas/QuoteItemScalarFieldEnumSchema'
import { QuoteItemScalarWhereWithAggregatesInputSchema } from '../inputTypeSchemas/QuoteItemScalarWhereWithAggregatesInputSchema'

export const QuoteItemGroupByArgsSchema: z.ZodType<Prisma.QuoteItemGroupByArgs> = z.object({
  where: QuoteItemWhereInputSchema.optional(), 
  orderBy: z.union([ QuoteItemOrderByWithAggregationInputSchema.array(), QuoteItemOrderByWithAggregationInputSchema ]).optional(),
  by: QuoteItemScalarFieldEnumSchema.array(), 
  having: QuoteItemScalarWhereWithAggregatesInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export default QuoteItemGroupByArgsSchema;
