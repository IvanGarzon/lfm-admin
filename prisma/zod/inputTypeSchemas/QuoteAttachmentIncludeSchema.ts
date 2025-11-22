import { z } from 'zod';
import type { Prisma } from '@/prisma/client';
import { QuoteArgsSchema } from "../outputTypeSchemas/QuoteArgsSchema"

export const QuoteAttachmentIncludeSchema: z.ZodType<Prisma.QuoteAttachmentInclude> = z.object({
  quote: z.union([z.boolean(),z.lazy(() => QuoteArgsSchema)]).optional(),
}).strict();

export default QuoteAttachmentIncludeSchema;
