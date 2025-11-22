import { z } from 'zod';
import type { Prisma } from '@/prisma/client';
import { QuoteAttachmentIncludeSchema } from '../inputTypeSchemas/QuoteAttachmentIncludeSchema'
import { QuoteAttachmentUpdateInputSchema } from '../inputTypeSchemas/QuoteAttachmentUpdateInputSchema'
import { QuoteAttachmentUncheckedUpdateInputSchema } from '../inputTypeSchemas/QuoteAttachmentUncheckedUpdateInputSchema'
import { QuoteAttachmentWhereUniqueInputSchema } from '../inputTypeSchemas/QuoteAttachmentWhereUniqueInputSchema'
import { QuoteArgsSchema } from "../outputTypeSchemas/QuoteArgsSchema"
// Select schema needs to be in file to prevent circular imports
//------------------------------------------------------

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

export const QuoteAttachmentUpdateArgsSchema: z.ZodType<Prisma.QuoteAttachmentUpdateArgs> = z.object({
  select: QuoteAttachmentSelectSchema.optional(),
  include: z.lazy(() => QuoteAttachmentIncludeSchema).optional(),
  data: z.union([ QuoteAttachmentUpdateInputSchema, QuoteAttachmentUncheckedUpdateInputSchema ]),
  where: QuoteAttachmentWhereUniqueInputSchema, 
}).strict();

export default QuoteAttachmentUpdateArgsSchema;
