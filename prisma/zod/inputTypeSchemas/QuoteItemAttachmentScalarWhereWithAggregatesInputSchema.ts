import type { Prisma } from '@/prisma/client';

import { z } from 'zod';
import { StringWithAggregatesFilterSchema } from './StringWithAggregatesFilterSchema';
import { IntWithAggregatesFilterSchema } from './IntWithAggregatesFilterSchema';
import { StringNullableWithAggregatesFilterSchema } from './StringNullableWithAggregatesFilterSchema';
import { DateTimeWithAggregatesFilterSchema } from './DateTimeWithAggregatesFilterSchema';

export const QuoteItemAttachmentScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.QuoteItemAttachmentScalarWhereWithAggregatesInput> = z.strictObject({
  AND: z.union([ z.lazy(() => QuoteItemAttachmentScalarWhereWithAggregatesInputSchema), z.lazy(() => QuoteItemAttachmentScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  OR: z.lazy(() => QuoteItemAttachmentScalarWhereWithAggregatesInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => QuoteItemAttachmentScalarWhereWithAggregatesInputSchema), z.lazy(() => QuoteItemAttachmentScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  quoteItemId: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  fileName: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  fileSize: z.union([ z.lazy(() => IntWithAggregatesFilterSchema), z.number() ]).optional(),
  mimeType: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  s3Key: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  s3Url: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  uploadedBy: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
  uploadedAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema), z.coerce.date() ]).optional(),
});

export default QuoteItemAttachmentScalarWhereWithAggregatesInputSchema;
