import { z } from 'zod';
import type { Prisma } from '@/prisma/client';
import { QuoteItemAttachmentUpdateManyMutationInputSchema } from '../inputTypeSchemas/QuoteItemAttachmentUpdateManyMutationInputSchema'
import { QuoteItemAttachmentUncheckedUpdateManyInputSchema } from '../inputTypeSchemas/QuoteItemAttachmentUncheckedUpdateManyInputSchema'
import { QuoteItemAttachmentWhereInputSchema } from '../inputTypeSchemas/QuoteItemAttachmentWhereInputSchema'

export const QuoteItemAttachmentUpdateManyAndReturnArgsSchema: z.ZodType<Prisma.QuoteItemAttachmentUpdateManyAndReturnArgs> = z.object({
  data: z.union([ QuoteItemAttachmentUpdateManyMutationInputSchema, QuoteItemAttachmentUncheckedUpdateManyInputSchema ]),
  where: QuoteItemAttachmentWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export default QuoteItemAttachmentUpdateManyAndReturnArgsSchema;
