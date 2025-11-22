import { z } from 'zod';
import type { Prisma } from '@/prisma/client';
import { InvoiceItemIncludeSchema } from '../inputTypeSchemas/InvoiceItemIncludeSchema'
import { InvoiceItemCreateInputSchema } from '../inputTypeSchemas/InvoiceItemCreateInputSchema'
import { InvoiceItemUncheckedCreateInputSchema } from '../inputTypeSchemas/InvoiceItemUncheckedCreateInputSchema'
import { InvoiceArgsSchema } from "../outputTypeSchemas/InvoiceArgsSchema"
import { ProductArgsSchema } from "../outputTypeSchemas/ProductArgsSchema"
// Select schema needs to be in file to prevent circular imports
//------------------------------------------------------

export const InvoiceItemSelectSchema: z.ZodType<Prisma.InvoiceItemSelect> = z.object({
  id: z.boolean().optional(),
  invoiceId: z.boolean().optional(),
  description: z.boolean().optional(),
  quantity: z.boolean().optional(),
  unitPrice: z.boolean().optional(),
  total: z.boolean().optional(),
  productId: z.boolean().optional(),
  createdAt: z.boolean().optional(),
  updatedAt: z.boolean().optional(),
  invoice: z.union([z.boolean(),z.lazy(() => InvoiceArgsSchema)]).optional(),
  product: z.union([z.boolean(),z.lazy(() => ProductArgsSchema)]).optional(),
}).strict()

export const InvoiceItemCreateArgsSchema: z.ZodType<Prisma.InvoiceItemCreateArgs> = z.object({
  select: InvoiceItemSelectSchema.optional(),
  include: z.lazy(() => InvoiceItemIncludeSchema).optional(),
  data: z.union([ InvoiceItemCreateInputSchema, InvoiceItemUncheckedCreateInputSchema ]),
}).strict();

export default InvoiceItemCreateArgsSchema;
