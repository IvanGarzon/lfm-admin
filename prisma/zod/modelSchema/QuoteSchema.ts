import { z } from 'zod';
import { Prisma } from '@/prisma/client'
import { QuoteStatusSchema } from '../inputTypeSchemas/QuoteStatusSchema'
import { CustomerWithRelationsSchema } from './CustomerSchema'
import type { CustomerWithRelations } from './CustomerSchema'
import { QuoteItemWithRelationsSchema } from './QuoteItemSchema'
import type { QuoteItemWithRelations } from './QuoteItemSchema'
import { QuoteAttachmentWithRelationsSchema } from './QuoteAttachmentSchema'
import type { QuoteAttachmentWithRelations } from './QuoteAttachmentSchema'
import { QuoteStatusHistoryWithRelationsSchema } from './QuoteStatusHistorySchema'
import type { QuoteStatusHistoryWithRelations } from './QuoteStatusHistorySchema'

/////////////////////////////////////////
// QUOTE SCHEMA
/////////////////////////////////////////

export const QuoteSchema = z.object({
  status: QuoteStatusSchema,
  id: z.cuid(),
  quoteNumber: z.string(),
  customerId: z.string(),
  versionNumber: z.number().int(),
  parentQuoteId: z.string().nullish(),
  amount: z.instanceof(Prisma.Decimal, { message: "Field 'amount' must be a Decimal. Location: ['Models', 'Quote']"}),
  currency: z.string(),
  gst: z.instanceof(Prisma.Decimal, { message: "Field 'gst' must be a Decimal. Location: ['Models', 'Quote']"}),
  discount: z.instanceof(Prisma.Decimal, { message: "Field 'discount' must be a Decimal. Location: ['Models', 'Quote']"}),
  issuedDate: z.coerce.date(),
  validUntil: z.coerce.date(),
  invoiceId: z.string().nullish(),
  notes: z.string().nullish(),
  terms: z.string().nullish(),
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
  parentQuote?: QuoteWithRelations | null;
  versions: QuoteWithRelations[];
  items: QuoteItemWithRelations[];
  attachments: QuoteAttachmentWithRelations[];
  statusHistory: QuoteStatusHistoryWithRelations[];
};

export type QuoteWithRelations = z.infer<typeof QuoteSchema> & QuoteRelations

export const QuoteWithRelationsSchema: z.ZodType<QuoteWithRelations> = QuoteSchema.merge(z.object({
  customer: z.lazy(() => CustomerWithRelationsSchema),
  parentQuote: z.lazy(() => QuoteWithRelationsSchema).nullish(),
  versions: z.lazy(() => QuoteWithRelationsSchema).array(),
  items: z.lazy(() => QuoteItemWithRelationsSchema).array(),
  attachments: z.lazy(() => QuoteAttachmentWithRelationsSchema).array(),
  statusHistory: z.lazy(() => QuoteStatusHistoryWithRelationsSchema).array(),
}))

export default QuoteSchema;
