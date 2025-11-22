import { z } from 'zod';
import type { Prisma } from '@/prisma/client';
import { QuoteItemAttachmentIncludeSchema } from '../inputTypeSchemas/QuoteItemAttachmentIncludeSchema'
import { QuoteItemAttachmentCreateInputSchema } from '../inputTypeSchemas/QuoteItemAttachmentCreateInputSchema'
import { QuoteItemAttachmentUncheckedCreateInputSchema } from '../inputTypeSchemas/QuoteItemAttachmentUncheckedCreateInputSchema'
import { QuoteItemArgsSchema } from "../outputTypeSchemas/QuoteItemArgsSchema"
// Select schema needs to be in file to prevent circular imports
//------------------------------------------------------

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

export const QuoteItemAttachmentCreateArgsSchema: z.ZodType<Prisma.QuoteItemAttachmentCreateArgs> = z.object({
  select: QuoteItemAttachmentSelectSchema.optional(),
  include: z.lazy(() => QuoteItemAttachmentIncludeSchema).optional(),
  data: z.union([ QuoteItemAttachmentCreateInputSchema, QuoteItemAttachmentUncheckedCreateInputSchema ]),
}).strict();

export default QuoteItemAttachmentCreateArgsSchema;
