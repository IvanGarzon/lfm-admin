import { z } from 'zod';
import type { Prisma } from '@/prisma/client';
import { QuoteItemAttachmentWhereInputSchema } from '../inputTypeSchemas/QuoteItemAttachmentWhereInputSchema'
import { QuoteItemAttachmentOrderByWithAggregationInputSchema } from '../inputTypeSchemas/QuoteItemAttachmentOrderByWithAggregationInputSchema'
import { QuoteItemAttachmentScalarFieldEnumSchema } from '../inputTypeSchemas/QuoteItemAttachmentScalarFieldEnumSchema'
import { QuoteItemAttachmentScalarWhereWithAggregatesInputSchema } from '../inputTypeSchemas/QuoteItemAttachmentScalarWhereWithAggregatesInputSchema'

export const QuoteItemAttachmentGroupByArgsSchema: z.ZodType<Prisma.QuoteItemAttachmentGroupByArgs> = z.object({
  where: QuoteItemAttachmentWhereInputSchema.optional(), 
  orderBy: z.union([ QuoteItemAttachmentOrderByWithAggregationInputSchema.array(), QuoteItemAttachmentOrderByWithAggregationInputSchema ]).optional(),
  by: QuoteItemAttachmentScalarFieldEnumSchema.array(), 
  having: QuoteItemAttachmentScalarWhereWithAggregatesInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export default QuoteItemAttachmentGroupByArgsSchema;
