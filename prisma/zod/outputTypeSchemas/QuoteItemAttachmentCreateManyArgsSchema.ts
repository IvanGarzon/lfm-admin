import { z } from 'zod';
import type { Prisma } from '@/prisma/client';
import { QuoteItemAttachmentCreateManyInputSchema } from '../inputTypeSchemas/QuoteItemAttachmentCreateManyInputSchema'

export const QuoteItemAttachmentCreateManyArgsSchema: z.ZodType<Prisma.QuoteItemAttachmentCreateManyArgs> = z.object({
  data: z.union([ QuoteItemAttachmentCreateManyInputSchema, QuoteItemAttachmentCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export default QuoteItemAttachmentCreateManyArgsSchema;
