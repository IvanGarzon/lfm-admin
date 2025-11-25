import { z } from 'zod';
import type { Prisma } from '@/prisma/client';
import { CustomerArgsSchema } from "../outputTypeSchemas/CustomerArgsSchema"
import { QuoteArgsSchema } from "../outputTypeSchemas/QuoteArgsSchema"
import { QuoteFindManyArgsSchema } from "../outputTypeSchemas/QuoteFindManyArgsSchema"
import { QuoteItemFindManyArgsSchema } from "../outputTypeSchemas/QuoteItemFindManyArgsSchema"
import { QuoteAttachmentFindManyArgsSchema } from "../outputTypeSchemas/QuoteAttachmentFindManyArgsSchema"
import { QuoteStatusHistoryFindManyArgsSchema } from "../outputTypeSchemas/QuoteStatusHistoryFindManyArgsSchema"
import { QuoteCountOutputTypeArgsSchema } from "../outputTypeSchemas/QuoteCountOutputTypeArgsSchema"

export const QuoteIncludeSchema: z.ZodType<Prisma.QuoteInclude> = z.object({
  customer: z.union([z.boolean(),z.lazy(() => CustomerArgsSchema)]).optional(),
  parentQuote: z.union([z.boolean(),z.lazy(() => QuoteArgsSchema)]).optional(),
  versions: z.union([z.boolean(),z.lazy(() => QuoteFindManyArgsSchema)]).optional(),
  items: z.union([z.boolean(),z.lazy(() => QuoteItemFindManyArgsSchema)]).optional(),
  attachments: z.union([z.boolean(),z.lazy(() => QuoteAttachmentFindManyArgsSchema)]).optional(),
  statusHistory: z.union([z.boolean(),z.lazy(() => QuoteStatusHistoryFindManyArgsSchema)]).optional(),
  _count: z.union([z.boolean(),z.lazy(() => QuoteCountOutputTypeArgsSchema)]).optional(),
}).strict();

export default QuoteIncludeSchema;
