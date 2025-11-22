import { z } from 'zod';
import { QuoteItemWithRelationsSchema } from './QuoteItemSchema'
import type { QuoteItemWithRelations } from './QuoteItemSchema'

/////////////////////////////////////////
// QUOTE ITEM ATTACHMENT SCHEMA
/////////////////////////////////////////

export const QuoteItemAttachmentSchema = z.object({
  id: z.cuid(),
  quoteItemId: z.string(),
  fileName: z.string(),
  fileSize: z.number().int(),
  mimeType: z.string(),
  s3Key: z.string(),
  s3Url: z.string(),
  uploadedBy: z.string().nullish(),
  uploadedAt: z.coerce.date(),
})

export type QuoteItemAttachment = z.infer<typeof QuoteItemAttachmentSchema>

/////////////////////////////////////////
// QUOTE ITEM ATTACHMENT RELATION SCHEMA
/////////////////////////////////////////

export type QuoteItemAttachmentRelations = {
  quoteItem: QuoteItemWithRelations;
};

export type QuoteItemAttachmentWithRelations = z.infer<typeof QuoteItemAttachmentSchema> & QuoteItemAttachmentRelations

export const QuoteItemAttachmentWithRelationsSchema: z.ZodType<QuoteItemAttachmentWithRelations> = QuoteItemAttachmentSchema.merge(z.object({
  quoteItem: z.lazy(() => QuoteItemWithRelationsSchema),
}))

export default QuoteItemAttachmentSchema;
