import type { Prisma } from '@/prisma/client';

import { z } from 'zod';
import { StringFilterSchema } from './StringFilterSchema';
import { IntFilterSchema } from './IntFilterSchema';
import { StringNullableFilterSchema } from './StringNullableFilterSchema';
import { DateTimeFilterSchema } from './DateTimeFilterSchema';
import { QuoteItemScalarRelationFilterSchema } from './QuoteItemScalarRelationFilterSchema';
import { QuoteItemWhereInputSchema } from './QuoteItemWhereInputSchema';

export const QuoteItemAttachmentWhereInputSchema: z.ZodType<Prisma.QuoteItemAttachmentWhereInput> = z.strictObject({
  AND: z.union([ z.lazy(() => QuoteItemAttachmentWhereInputSchema), z.lazy(() => QuoteItemAttachmentWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => QuoteItemAttachmentWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => QuoteItemAttachmentWhereInputSchema), z.lazy(() => QuoteItemAttachmentWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  quoteItemId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  fileName: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  fileSize: z.union([ z.lazy(() => IntFilterSchema), z.number() ]).optional(),
  mimeType: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  s3Key: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  s3Url: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  uploadedBy: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  uploadedAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  quoteItem: z.union([ z.lazy(() => QuoteItemScalarRelationFilterSchema), z.lazy(() => QuoteItemWhereInputSchema) ]).optional(),
});

export default QuoteItemAttachmentWhereInputSchema;
