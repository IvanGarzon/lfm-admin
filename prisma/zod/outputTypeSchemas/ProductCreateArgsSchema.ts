import { z } from 'zod';
import type { Prisma } from '@/prisma/client';
import { ProductIncludeSchema } from '../inputTypeSchemas/ProductIncludeSchema'
import { ProductCreateInputSchema } from '../inputTypeSchemas/ProductCreateInputSchema'
import { ProductUncheckedCreateInputSchema } from '../inputTypeSchemas/ProductUncheckedCreateInputSchema'
import { InvoiceItemFindManyArgsSchema } from "../outputTypeSchemas/InvoiceItemFindManyArgsSchema"
import { QuoteItemFindManyArgsSchema } from "../outputTypeSchemas/QuoteItemFindManyArgsSchema"
import { ProductCountOutputTypeArgsSchema } from "../outputTypeSchemas/ProductCountOutputTypeArgsSchema"
// Select schema needs to be in file to prevent circular imports
//------------------------------------------------------

export const ProductSelectSchema: z.ZodType<Prisma.ProductSelect> = z.object({
  id: z.boolean().optional(),
  imageUrl: z.boolean().optional(),
  name: z.boolean().optional(),
  description: z.boolean().optional(),
  status: z.boolean().optional(),
  price: z.boolean().optional(),
  stock: z.boolean().optional(),
  createdAt: z.boolean().optional(),
  updatedAt: z.boolean().optional(),
  availableAt: z.boolean().optional(),
  invoiceItems: z.union([z.boolean(),z.lazy(() => InvoiceItemFindManyArgsSchema)]).optional(),
  quoteItems: z.union([z.boolean(),z.lazy(() => QuoteItemFindManyArgsSchema)]).optional(),
  _count: z.union([z.boolean(),z.lazy(() => ProductCountOutputTypeArgsSchema)]).optional(),
}).strict()

export const ProductCreateArgsSchema: z.ZodType<Prisma.ProductCreateArgs> = z.object({
  select: ProductSelectSchema.optional(),
  include: z.lazy(() => ProductIncludeSchema).optional(),
  data: z.union([ ProductCreateInputSchema, ProductUncheckedCreateInputSchema ]),
}).strict();

export default ProductCreateArgsSchema;
