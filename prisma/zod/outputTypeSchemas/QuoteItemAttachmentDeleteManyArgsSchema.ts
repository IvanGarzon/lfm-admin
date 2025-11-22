import { z } from 'zod';
import type { Prisma } from '@/prisma/client';
import { QuoteItemAttachmentWhereInputSchema } from '../inputTypeSchemas/QuoteItemAttachmentWhereInputSchema'

export const QuoteItemAttachmentDeleteManyArgsSchema: z.ZodType<Prisma.QuoteItemAttachmentDeleteManyArgs> = z.object({
  where: QuoteItemAttachmentWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export default QuoteItemAttachmentDeleteManyArgsSchema;
