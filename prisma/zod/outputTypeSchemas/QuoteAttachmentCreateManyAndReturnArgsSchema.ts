import { z } from 'zod';
import type { Prisma } from '@/prisma/client';
import { QuoteAttachmentCreateManyInputSchema } from '../inputTypeSchemas/QuoteAttachmentCreateManyInputSchema'

export const QuoteAttachmentCreateManyAndReturnArgsSchema: z.ZodType<Prisma.QuoteAttachmentCreateManyAndReturnArgs> = z.object({
  data: z.union([ QuoteAttachmentCreateManyInputSchema, QuoteAttachmentCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export default QuoteAttachmentCreateManyAndReturnArgsSchema;
