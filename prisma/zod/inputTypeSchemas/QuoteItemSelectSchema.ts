import { z } from 'zod';
import type { Prisma } from '@/prisma/client';
import { QuoteArgsSchema } from "../outputTypeSchemas/QuoteArgsSchema"
import { ProductArgsSchema } from "../outputTypeSchemas/ProductArgsSchema"
import { QuoteItemAttachmentFindManyArgsSchema } from "../outputTypeSchemas/QuoteItemAttachmentFindManyArgsSchema"
import { QuoteItemCountOutputTypeArgsSchema } from "../outputTypeSchemas/QuoteItemCountOutputTypeArgsSchema"

export const QuoteItemSelectSchema: z.ZodType<Prisma.QuoteItemSelect> = z.object({
  id: z.boolean().optional(),
  quoteId: z.boolean().optional(),
  description: z.boolean().optional(),
  quantity: z.boolean().optional(),
  unitPrice: z.boolean().optional(),
  total: z.boolean().optional(),
  order: z.boolean().optional(),
  productId: z.boolean().optional(),
  notes: z.boolean().optional(),
  colorPalette: z.boolean().optional(),
  createdAt: z.boolean().optional(),
  updatedAt: z.boolean().optional(),
  quote: z.union([z.boolean(),z.lazy(() => QuoteArgsSchema)]).optional(),
  product: z.union([z.boolean(),z.lazy(() => ProductArgsSchema)]).optional(),
  attachments: z.union([z.boolean(),z.lazy(() => QuoteItemAttachmentFindManyArgsSchema)]).optional(),
  _count: z.union([z.boolean(),z.lazy(() => QuoteItemCountOutputTypeArgsSchema)]).optional(),
}).strict()

export default QuoteItemSelectSchema;
