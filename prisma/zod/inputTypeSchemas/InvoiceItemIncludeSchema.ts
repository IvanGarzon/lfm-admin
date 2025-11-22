import { z } from 'zod';
import type { Prisma } from '@/prisma/client';
import { InvoiceArgsSchema } from "../outputTypeSchemas/InvoiceArgsSchema"
import { ProductArgsSchema } from "../outputTypeSchemas/ProductArgsSchema"

export const InvoiceItemIncludeSchema: z.ZodType<Prisma.InvoiceItemInclude> = z.object({
  invoice: z.union([z.boolean(),z.lazy(() => InvoiceArgsSchema)]).optional(),
  product: z.union([z.boolean(),z.lazy(() => ProductArgsSchema)]).optional(),
}).strict();

export default InvoiceItemIncludeSchema;
