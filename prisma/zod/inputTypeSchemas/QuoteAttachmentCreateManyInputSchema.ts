import type { Prisma } from '@/prisma/client';

import { z } from 'zod';

export const QuoteAttachmentCreateManyInputSchema: z.ZodType<Prisma.QuoteAttachmentCreateManyInput> = z.strictObject({
  id: z.cuid().optional(),
  quoteId: z.string(),
  fileName: z.string(),
  fileSize: z.number().int(),
  mimeType: z.string(),
  s3Key: z.string(),
  s3Url: z.string(),
  uploadedBy: z.string().optional().nullable(),
  uploadedAt: z.coerce.date().optional(),
});

export default QuoteAttachmentCreateManyInputSchema;
