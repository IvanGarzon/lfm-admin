import type { Prisma } from '@/prisma/client';

import { z } from 'zod';

export const QuoteItemAttachmentUncheckedCreateInputSchema: z.ZodType<Prisma.QuoteItemAttachmentUncheckedCreateInput> = z.strictObject({
  id: z.cuid().optional(),
  quoteItemId: z.string(),
  fileName: z.string(),
  fileSize: z.number().int(),
  mimeType: z.string(),
  s3Key: z.string(),
  s3Url: z.string(),
  uploadedBy: z.string().optional().nullable(),
  uploadedAt: z.coerce.date().optional(),
});

export default QuoteItemAttachmentUncheckedCreateInputSchema;
