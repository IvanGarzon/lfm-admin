import type { Prisma } from '@/prisma/client';

import { z } from 'zod';
import { StringFilterSchema } from './StringFilterSchema';
import { IntFilterSchema } from './IntFilterSchema';
import { StringNullableFilterSchema } from './StringNullableFilterSchema';
import { DateTimeFilterSchema } from './DateTimeFilterSchema';

export const QuoteItemAttachmentScalarWhereInputSchema: z.ZodType<Prisma.QuoteItemAttachmentScalarWhereInput> = z.strictObject({
  AND: z.union([ z.lazy(() => QuoteItemAttachmentScalarWhereInputSchema), z.lazy(() => QuoteItemAttachmentScalarWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => QuoteItemAttachmentScalarWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => QuoteItemAttachmentScalarWhereInputSchema), z.lazy(() => QuoteItemAttachmentScalarWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  quoteItemId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  fileName: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  fileSize: z.union([ z.lazy(() => IntFilterSchema), z.number() ]).optional(),
  mimeType: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  s3Key: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  s3Url: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  uploadedBy: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  uploadedAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
});

export default QuoteItemAttachmentScalarWhereInputSchema;
