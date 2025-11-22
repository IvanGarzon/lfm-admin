import { z } from 'zod';
import type { Prisma } from '@/prisma/client';
import { CustomerArgsSchema } from "../outputTypeSchemas/CustomerArgsSchema"
import { QuoteItemFindManyArgsSchema } from "../outputTypeSchemas/QuoteItemFindManyArgsSchema"
import { QuoteAttachmentFindManyArgsSchema } from "../outputTypeSchemas/QuoteAttachmentFindManyArgsSchema"
import { QuoteCountOutputTypeArgsSchema } from "../outputTypeSchemas/QuoteCountOutputTypeArgsSchema"

export const QuoteIncludeSchema: z.ZodType<Prisma.QuoteInclude> = z.object({
  customer: z.union([z.boolean(),z.lazy(() => CustomerArgsSchema)]).optional(),
  items: z.union([z.boolean(),z.lazy(() => QuoteItemFindManyArgsSchema)]).optional(),
  attachments: z.union([z.boolean(),z.lazy(() => QuoteAttachmentFindManyArgsSchema)]).optional(),
  _count: z.union([z.boolean(),z.lazy(() => QuoteCountOutputTypeArgsSchema)]).optional(),
}).strict();

export default QuoteIncludeSchema;
