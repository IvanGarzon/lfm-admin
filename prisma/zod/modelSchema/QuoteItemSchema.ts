import { z } from 'zod';
import { Prisma } from '@/prisma/client'
import { QuoteWithRelationsSchema } from './QuoteSchema'
import type { QuoteWithRelations } from './QuoteSchema'
import { ProductWithRelationsSchema } from './ProductSchema'
import type { ProductWithRelations } from './ProductSchema'
import { QuoteItemAttachmentWithRelationsSchema } from './QuoteItemAttachmentSchema'
import type { QuoteItemAttachmentWithRelations } from './QuoteItemAttachmentSchema'

/////////////////////////////////////////
// QUOTE ITEM SCHEMA
/////////////////////////////////////////

export const QuoteItemSchema = z.object({
  id: z.cuid(),
  quoteId: z.string(),
  description: z.string(),
  quantity: z.number().int(),
  unitPrice: z.instanceof(Prisma.Decimal, { message: "Field 'unitPrice' must be a Decimal. Location: ['Models', 'QuoteItem']"}),
  total: z.instanceof(Prisma.Decimal, { message: "Field 'total' must be a Decimal. Location: ['Models', 'QuoteItem']"}),
  order: z.number().int(),
  productId: z.string().nullish(),
  colors: z.string().array(),
  notes: z.string().nullish(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export type QuoteItem = z.infer<typeof QuoteItemSchema>

/////////////////////////////////////////
// QUOTE ITEM RELATION SCHEMA
/////////////////////////////////////////

export type QuoteItemRelations = {
  quote: QuoteWithRelations;
  product?: ProductWithRelations | null;
  attachments: QuoteItemAttachmentWithRelations[];
};

export type QuoteItemWithRelations = z.infer<typeof QuoteItemSchema> & QuoteItemRelations

export const QuoteItemWithRelationsSchema: z.ZodType<QuoteItemWithRelations> = QuoteItemSchema.merge(z.object({
  quote: z.lazy(() => QuoteWithRelationsSchema),
  product: z.lazy(() => ProductWithRelationsSchema).nullish(),
  attachments: z.lazy(() => QuoteItemAttachmentWithRelationsSchema).array(),
}))

export default QuoteItemSchema;
