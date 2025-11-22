import { z } from 'zod';
import type { Prisma } from '@/prisma/client';
import { InvoiceItemFindManyArgsSchema } from "../outputTypeSchemas/InvoiceItemFindManyArgsSchema"
import { QuoteItemFindManyArgsSchema } from "../outputTypeSchemas/QuoteItemFindManyArgsSchema"
import { ProductCountOutputTypeArgsSchema } from "../outputTypeSchemas/ProductCountOutputTypeArgsSchema"

export const ProductIncludeSchema: z.ZodType<Prisma.ProductInclude> = z.object({
  invoiceItems: z.union([z.boolean(),z.lazy(() => InvoiceItemFindManyArgsSchema)]).optional(),
  quoteItems: z.union([z.boolean(),z.lazy(() => QuoteItemFindManyArgsSchema)]).optional(),
  _count: z.union([z.boolean(),z.lazy(() => ProductCountOutputTypeArgsSchema)]).optional(),
}).strict();

export default ProductIncludeSchema;
