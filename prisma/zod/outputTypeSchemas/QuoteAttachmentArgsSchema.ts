import { z } from 'zod';
import type { Prisma } from '@/prisma/client';
import { QuoteAttachmentSelectSchema } from '../inputTypeSchemas/QuoteAttachmentSelectSchema';
import { QuoteAttachmentIncludeSchema } from '../inputTypeSchemas/QuoteAttachmentIncludeSchema';

export const QuoteAttachmentArgsSchema: z.ZodType<Prisma.QuoteAttachmentDefaultArgs> = z.object({
  select: z.lazy(() => QuoteAttachmentSelectSchema).optional(),
  include: z.lazy(() => QuoteAttachmentIncludeSchema).optional(),
}).strict();

export default QuoteAttachmentArgsSchema;
