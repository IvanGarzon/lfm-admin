import { z } from 'zod';
import type { Prisma } from '@/prisma/client';
import { QuoteItemArgsSchema } from "../outputTypeSchemas/QuoteItemArgsSchema"

export const QuoteItemAttachmentIncludeSchema: z.ZodType<Prisma.QuoteItemAttachmentInclude> = z.object({
  quoteItem: z.union([z.boolean(),z.lazy(() => QuoteItemArgsSchema)]).optional(),
}).strict();

export default QuoteItemAttachmentIncludeSchema;
