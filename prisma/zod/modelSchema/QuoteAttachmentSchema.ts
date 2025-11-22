import { z } from 'zod';
import { QuoteWithRelationsSchema } from './QuoteSchema'
import type { QuoteWithRelations } from './QuoteSchema'

/////////////////////////////////////////
// QUOTE ATTACHMENT SCHEMA
/////////////////////////////////////////

export const QuoteAttachmentSchema = z.object({
  id: z.cuid(),
  quoteId: z.string(),
  fileName: z.string(),
  fileSize: z.number().int(),
  mimeType: z.string(),
  s3Key: z.string(),
  s3Url: z.string(),
  uploadedBy: z.string().nullish(),
  uploadedAt: z.coerce.date(),
})

export type QuoteAttachment = z.infer<typeof QuoteAttachmentSchema>

/////////////////////////////////////////
// QUOTE ATTACHMENT RELATION SCHEMA
/////////////////////////////////////////

export type QuoteAttachmentRelations = {
  quote: QuoteWithRelations;
};

export type QuoteAttachmentWithRelations = z.infer<typeof QuoteAttachmentSchema> & QuoteAttachmentRelations

export const QuoteAttachmentWithRelationsSchema: z.ZodType<QuoteAttachmentWithRelations> = QuoteAttachmentSchema.merge(z.object({
  quote: z.lazy(() => QuoteWithRelationsSchema),
}))

export default QuoteAttachmentSchema;
