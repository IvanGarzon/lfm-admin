import { z } from 'zod';
import { Prisma } from '@/prisma/client'
import { QuoteStatusSchema } from '../inputTypeSchemas/QuoteStatusSchema'
import { CustomerWithRelationsSchema } from './CustomerSchema'
import type { CustomerWithRelations } from './CustomerSchema'
import { QuoteItemWithRelationsSchema } from './QuoteItemSchema'
import type { QuoteItemWithRelations } from './QuoteItemSchema'
import { QuoteAttachmentWithRelationsSchema } from './QuoteAttachmentSchema'
import type { QuoteAttachmentWithRelations } from './QuoteAttachmentSchema'

/////////////////////////////////////////
// QUOTE SCHEMA
/////////////////////////////////////////

export const QuoteSchema = z.object({
  status: QuoteStatusSchema,
  id: z.cuid(),
  quoteNumber: z.string(),
  customerId: z.string(),
  amount: z.instanceof(Prisma.Decimal, { message: "Field 'amount' must be a Decimal. Location: ['Models', 'Quote']"}),
  currency: z.string(),
  gst: z.instanceof(Prisma.Decimal, { message: "Field 'gst' must be a Decimal. Location: ['Models', 'Quote']"}),
  discount: z.instanceof(Prisma.Decimal, { message: "Field 'discount' must be a Decimal. Location: ['Models', 'Quote']"}),
  issuedDate: z.coerce.date(),
  validUntil: z.coerce.date(),
  acceptedDate: z.coerce.date().nullish(),
  rejectedDate: z.coerce.date().nullish(),
  rejectReason: z.string().nullish(),
  convertedDate: z.coerce.date().nullish(),
  invoiceId: z.string().nullish(),
  notes: z.string().nullish(),
  terms: z.string().nullish(),
  colorPalette: z.string().nullish(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  deletedAt: z.coerce.date().nullish(),
})

export type Quote = z.infer<typeof QuoteSchema>

/////////////////////////////////////////
// QUOTE RELATION SCHEMA
/////////////////////////////////////////

export type QuoteRelations = {
  customer: CustomerWithRelations;
  items: QuoteItemWithRelations[];
  attachments: QuoteAttachmentWithRelations[];
};

export type QuoteWithRelations = z.infer<typeof QuoteSchema> & QuoteRelations

export const QuoteWithRelationsSchema: z.ZodType<QuoteWithRelations> = QuoteSchema.merge(z.object({
  customer: z.lazy(() => CustomerWithRelationsSchema),
  items: z.lazy(() => QuoteItemWithRelationsSchema).array(),
  attachments: z.lazy(() => QuoteAttachmentWithRelationsSchema).array(),
}))

export default QuoteSchema;
