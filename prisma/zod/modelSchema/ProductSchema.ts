import { z } from 'zod';
import { Prisma } from '@/prisma/client'
import { ProductStatusSchema } from '../inputTypeSchemas/ProductStatusSchema'
import { InvoiceItemWithRelationsSchema } from './InvoiceItemSchema'
import type { InvoiceItemWithRelations } from './InvoiceItemSchema'
import { QuoteItemWithRelationsSchema } from './QuoteItemSchema'
import type { QuoteItemWithRelations } from './QuoteItemSchema'

/////////////////////////////////////////
// PRODUCT SCHEMA
/////////////////////////////////////////

export const ProductSchema = z.object({
  status: ProductStatusSchema,
  id: z.cuid(),
  imageUrl: z.string().nullish(),
  name: z.string(),
  description: z.string().nullish(),
  price: z.instanceof(Prisma.Decimal, { message: "Field 'price' must be a Decimal. Location: ['Models', 'Product']"}),
  stock: z.number().int(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  availableAt: z.coerce.date().nullish(),
})

export type Product = z.infer<typeof ProductSchema>

/////////////////////////////////////////
// PRODUCT RELATION SCHEMA
/////////////////////////////////////////

export type ProductRelations = {
  invoiceItems: InvoiceItemWithRelations[];
  quoteItems: QuoteItemWithRelations[];
};

export type ProductWithRelations = z.infer<typeof ProductSchema> & ProductRelations

export const ProductWithRelationsSchema: z.ZodType<ProductWithRelations> = ProductSchema.merge(z.object({
  invoiceItems: z.lazy(() => InvoiceItemWithRelationsSchema).array(),
  quoteItems: z.lazy(() => QuoteItemWithRelationsSchema).array(),
}))

export default ProductSchema;
