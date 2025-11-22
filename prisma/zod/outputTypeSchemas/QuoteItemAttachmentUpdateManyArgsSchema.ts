import { z } from 'zod';
import type { Prisma } from '@/prisma/client';
import { QuoteItemAttachmentUpdateManyMutationInputSchema } from '../inputTypeSchemas/QuoteItemAttachmentUpdateManyMutationInputSchema'
import { QuoteItemAttachmentUncheckedUpdateManyInputSchema } from '../inputTypeSchemas/QuoteItemAttachmentUncheckedUpdateManyInputSchema'
import { QuoteItemAttachmentWhereInputSchema } from '../inputTypeSchemas/QuoteItemAttachmentWhereInputSchema'

export const QuoteItemAttachmentUpdateManyArgsSchema: z.ZodType<Prisma.QuoteItemAttachmentUpdateManyArgs> = z.object({
  data: z.union([ QuoteItemAttachmentUpdateManyMutationInputSchema, QuoteItemAttachmentUncheckedUpdateManyInputSchema ]),
  where: QuoteItemAttachmentWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export default QuoteItemAttachmentUpdateManyArgsSchema;
