import { z } from 'zod';
import type { Prisma } from '@/prisma/client';
import { QuoteArgsSchema } from "../outputTypeSchemas/QuoteArgsSchema"
import { ProductArgsSchema } from "../outputTypeSchemas/ProductArgsSchema"
import { QuoteItemAttachmentFindManyArgsSchema } from "../outputTypeSchemas/QuoteItemAttachmentFindManyArgsSchema"
import { QuoteItemCountOutputTypeArgsSchema } from "../outputTypeSchemas/QuoteItemCountOutputTypeArgsSchema"

export const QuoteItemIncludeSchema: z.ZodType<Prisma.QuoteItemInclude> = z.object({
  quote: z.union([z.boolean(),z.lazy(() => QuoteArgsSchema)]).optional(),
  product: z.union([z.boolean(),z.lazy(() => ProductArgsSchema)]).optional(),
  attachments: z.union([z.boolean(),z.lazy(() => QuoteItemAttachmentFindManyArgsSchema)]).optional(),
  _count: z.union([z.boolean(),z.lazy(() => QuoteItemCountOutputTypeArgsSchema)]).optional(),
}).strict();

export default QuoteItemIncludeSchema;
