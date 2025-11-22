import { z } from 'zod';
import type { Prisma } from '@/prisma/client';
import { QuoteItemArgsSchema } from "../outputTypeSchemas/QuoteItemArgsSchema"

export const QuoteItemAttachmentSelectSchema: z.ZodType<Prisma.QuoteItemAttachmentSelect> = z.object({
  id: z.boolean().optional(),
  quoteItemId: z.boolean().optional(),
  fileName: z.boolean().optional(),
  fileSize: z.boolean().optional(),
  mimeType: z.boolean().optional(),
  s3Key: z.boolean().optional(),
  s3Url: z.boolean().optional(),
  uploadedBy: z.boolean().optional(),
  uploadedAt: z.boolean().optional(),
  quoteItem: z.union([z.boolean(),z.lazy(() => QuoteItemArgsSchema)]).optional(),
}).strict()

export default QuoteItemAttachmentSelectSchema;
