import { z } from 'zod';
import type { Prisma } from '@/prisma/client';
import { QuoteAttachmentWhereInputSchema } from '../inputTypeSchemas/QuoteAttachmentWhereInputSchema'

export const QuoteAttachmentDeleteManyArgsSchema: z.ZodType<Prisma.QuoteAttachmentDeleteManyArgs> = z.object({
  where: QuoteAttachmentWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export default QuoteAttachmentDeleteManyArgsSchema;
