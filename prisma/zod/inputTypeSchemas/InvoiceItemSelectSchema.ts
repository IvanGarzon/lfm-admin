import { z } from 'zod';
import type { Prisma } from '@/prisma/client';
import { InvoiceArgsSchema } from "../outputTypeSchemas/InvoiceArgsSchema"
import { ProductArgsSchema } from "../outputTypeSchemas/ProductArgsSchema"

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

export default InvoiceItemSelectSchema;
