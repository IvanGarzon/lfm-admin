import { z } from 'zod';
import type { Prisma } from '@/prisma/client';
import { QuoteAttachmentUpdateManyMutationInputSchema } from '../inputTypeSchemas/QuoteAttachmentUpdateManyMutationInputSchema'
import { QuoteAttachmentUncheckedUpdateManyInputSchema } from '../inputTypeSchemas/QuoteAttachmentUncheckedUpdateManyInputSchema'
import { QuoteAttachmentWhereInputSchema } from '../inputTypeSchemas/QuoteAttachmentWhereInputSchema'

export const QuoteAttachmentUpdateManyAndReturnArgsSchema: z.ZodType<Prisma.QuoteAttachmentUpdateManyAndReturnArgs> = z.object({
  data: z.union([ QuoteAttachmentUpdateManyMutationInputSchema, QuoteAttachmentUncheckedUpdateManyInputSchema ]),
  where: QuoteAttachmentWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export default QuoteAttachmentUpdateManyAndReturnArgsSchema;
