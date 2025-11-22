import { z } from 'zod';
import { Prisma } from '@/prisma/client'
import { InvoiceWithRelationsSchema } from './InvoiceSchema'
import type { InvoiceWithRelations } from './InvoiceSchema'
import { ProductWithRelationsSchema } from './ProductSchema'
import type { ProductWithRelations } from './ProductSchema'

/////////////////////////////////////////
// INVOICE ITEM SCHEMA
/////////////////////////////////////////

export const InvoiceItemSchema = z.object({
  id: z.cuid(),
  invoiceId: z.string(),
  description: z.string(),
  quantity: z.number().int(),
  unitPrice: z.instanceof(Prisma.Decimal, { message: "Field 'unitPrice' must be a Decimal. Location: ['Models', 'InvoiceItem']"}),
  total: z.instanceof(Prisma.Decimal, { message: "Field 'total' must be a Decimal. Location: ['Models', 'InvoiceItem']"}),
  productId: z.string().nullish(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export type InvoiceItem = z.infer<typeof InvoiceItemSchema>

/////////////////////////////////////////
// INVOICE ITEM RELATION SCHEMA
/////////////////////////////////////////

export type InvoiceItemRelations = {
  invoice: InvoiceWithRelations;
  product?: ProductWithRelations | null;
};

export type InvoiceItemWithRelations = z.infer<typeof InvoiceItemSchema> & InvoiceItemRelations

export const InvoiceItemWithRelationsSchema: z.ZodType<InvoiceItemWithRelations> = InvoiceItemSchema.merge(z.object({
  invoice: z.lazy(() => InvoiceWithRelationsSchema),
  product: z.lazy(() => ProductWithRelationsSchema).nullish(),
}))

export default InvoiceItemSchema;
