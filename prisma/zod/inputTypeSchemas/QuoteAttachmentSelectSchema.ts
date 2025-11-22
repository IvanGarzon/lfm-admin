import { z } from 'zod';
import type { Prisma } from '@/prisma/client';
import { QuoteArgsSchema } from "../outputTypeSchemas/QuoteArgsSchema"

export const QuoteAttachmentSelectSchema: z.ZodType<Prisma.QuoteAttachmentSelect> = z.object({
  id: z.boolean().optional(),
  quoteId: z.boolean().optional(),
  fileName: z.boolean().optional(),
  fileSize: z.boolean().optional(),
  mimeType: z.boolean().optional(),
  s3Key: z.boolean().optional(),
  s3Url: z.boolean().optional(),
  uploadedBy: z.boolean().optional(),
  uploadedAt: z.boolean().optional(),
  quote: z.union([z.boolean(),z.lazy(() => QuoteArgsSchema)]).optional(),
}).strict()

export default QuoteAttachmentSelectSchema;
