import { z } from 'zod';
import type { Prisma } from '@/prisma/client';
import { QuoteItemAttachmentWhereInputSchema } from '../inputTypeSchemas/QuoteItemAttachmentWhereInputSchema'
import { QuoteItemAttachmentOrderByWithRelationInputSchema } from '../inputTypeSchemas/QuoteItemAttachmentOrderByWithRelationInputSchema'
import { QuoteItemAttachmentWhereUniqueInputSchema } from '../inputTypeSchemas/QuoteItemAttachmentWhereUniqueInputSchema'

export const QuoteItemAttachmentAggregateArgsSchema: z.ZodType<Prisma.QuoteItemAttachmentAggregateArgs> = z.object({
  where: QuoteItemAttachmentWhereInputSchema.optional(), 
  orderBy: z.union([ QuoteItemAttachmentOrderByWithRelationInputSchema.array(), QuoteItemAttachmentOrderByWithRelationInputSchema ]).optional(),
  cursor: QuoteItemAttachmentWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export default QuoteItemAttachmentAggregateArgsSchema;
