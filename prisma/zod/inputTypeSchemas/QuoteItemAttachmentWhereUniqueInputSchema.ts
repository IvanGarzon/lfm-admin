import type { Prisma } from '@/prisma/client';

import { z } from 'zod';
import { QuoteItemAttachmentWhereInputSchema } from './QuoteItemAttachmentWhereInputSchema';
import { StringFilterSchema } from './StringFilterSchema';
import { IntFilterSchema } from './IntFilterSchema';
import { StringNullableFilterSchema } from './StringNullableFilterSchema';
import { DateTimeFilterSchema } from './DateTimeFilterSchema';
import { QuoteItemScalarRelationFilterSchema } from './QuoteItemScalarRelationFilterSchema';
import { QuoteItemWhereInputSchema } from './QuoteItemWhereInputSchema';

export const QuoteItemAttachmentWhereUniqueInputSchema: z.ZodType<Prisma.QuoteItemAttachmentWhereUniqueInput> = z.object({
  id: z.cuid(),
})
.and(z.strictObject({
  id: z.cuid().optional(),
  AND: z.union([ z.lazy(() => QuoteItemAttachmentWhereInputSchema), z.lazy(() => QuoteItemAttachmentWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => QuoteItemAttachmentWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => QuoteItemAttachmentWhereInputSchema), z.lazy(() => QuoteItemAttachmentWhereInputSchema).array() ]).optional(),
  quoteItemId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  fileName: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  fileSize: z.union([ z.lazy(() => IntFilterSchema), z.number().int() ]).optional(),
  mimeType: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  s3Key: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  s3Url: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  uploadedBy: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  uploadedAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  quoteItem: z.union([ z.lazy(() => QuoteItemScalarRelationFilterSchema), z.lazy(() => QuoteItemWhereInputSchema) ]).optional(),
}));

export default QuoteItemAttachmentWhereUniqueInputSchema;
