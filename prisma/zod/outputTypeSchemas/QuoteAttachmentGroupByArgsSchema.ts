import { z } from 'zod';
import type { Prisma } from '@/prisma/client';
import { QuoteAttachmentWhereInputSchema } from '../inputTypeSchemas/QuoteAttachmentWhereInputSchema'
import { QuoteAttachmentOrderByWithAggregationInputSchema } from '../inputTypeSchemas/QuoteAttachmentOrderByWithAggregationInputSchema'
import { QuoteAttachmentScalarFieldEnumSchema } from '../inputTypeSchemas/QuoteAttachmentScalarFieldEnumSchema'
import { QuoteAttachmentScalarWhereWithAggregatesInputSchema } from '../inputTypeSchemas/QuoteAttachmentScalarWhereWithAggregatesInputSchema'

export const QuoteAttachmentGroupByArgsSchema: z.ZodType<Prisma.QuoteAttachmentGroupByArgs> = z.object({
  where: QuoteAttachmentWhereInputSchema.optional(), 
  orderBy: z.union([ QuoteAttachmentOrderByWithAggregationInputSchema.array(), QuoteAttachmentOrderByWithAggregationInputSchema ]).optional(),
  by: QuoteAttachmentScalarFieldEnumSchema.array(), 
  having: QuoteAttachmentScalarWhereWithAggregatesInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export default QuoteAttachmentGroupByArgsSchema;
