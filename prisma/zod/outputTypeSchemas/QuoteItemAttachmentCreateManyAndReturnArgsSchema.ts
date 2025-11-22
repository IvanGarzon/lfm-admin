import { z } from 'zod';
import type { Prisma } from '@/prisma/client';
import { QuoteItemAttachmentCreateManyInputSchema } from '../inputTypeSchemas/QuoteItemAttachmentCreateManyInputSchema'

export const QuoteItemAttachmentCreateManyAndReturnArgsSchema: z.ZodType<Prisma.QuoteItemAttachmentCreateManyAndReturnArgs> = z.object({
  data: z.union([ QuoteItemAttachmentCreateManyInputSchema, QuoteItemAttachmentCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export default QuoteItemAttachmentCreateManyAndReturnArgsSchema;
