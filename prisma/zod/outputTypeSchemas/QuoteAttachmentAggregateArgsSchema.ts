import { z } from 'zod';
import type { Prisma } from '@/prisma/client';
import { QuoteAttachmentWhereInputSchema } from '../inputTypeSchemas/QuoteAttachmentWhereInputSchema'
import { QuoteAttachmentOrderByWithRelationInputSchema } from '../inputTypeSchemas/QuoteAttachmentOrderByWithRelationInputSchema'
import { QuoteAttachmentWhereUniqueInputSchema } from '../inputTypeSchemas/QuoteAttachmentWhereUniqueInputSchema'

export const QuoteAttachmentAggregateArgsSchema: z.ZodType<Prisma.QuoteAttachmentAggregateArgs> = z.object({
  where: QuoteAttachmentWhereInputSchema.optional(), 
  orderBy: z.union([ QuoteAttachmentOrderByWithRelationInputSchema.array(), QuoteAttachmentOrderByWithRelationInputSchema ]).optional(),
  cursor: QuoteAttachmentWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export default QuoteAttachmentAggregateArgsSchema;
