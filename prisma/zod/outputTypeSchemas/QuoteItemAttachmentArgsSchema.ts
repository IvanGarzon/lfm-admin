import { z } from 'zod';
import type { Prisma } from '@/prisma/client';
import { QuoteItemAttachmentSelectSchema } from '../inputTypeSchemas/QuoteItemAttachmentSelectSchema';
import { QuoteItemAttachmentIncludeSchema } from '../inputTypeSchemas/QuoteItemAttachmentIncludeSchema';

export const QuoteItemAttachmentArgsSchema: z.ZodType<Prisma.QuoteItemAttachmentDefaultArgs> = z.object({
  select: z.lazy(() => QuoteItemAttachmentSelectSchema).optional(),
  include: z.lazy(() => QuoteItemAttachmentIncludeSchema).optional(),
}).strict();

export default QuoteItemAttachmentArgsSchema;
