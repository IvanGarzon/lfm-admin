import type { Prisma } from '@/prisma/client';

import { z } from 'zod';
import { StringFilterSchema } from './StringFilterSchema';
import { IntFilterSchema } from './IntFilterSchema';
import { StringNullableFilterSchema } from './StringNullableFilterSchema';
import { DateTimeFilterSchema } from './DateTimeFilterSchema';

export const QuoteAttachmentScalarWhereInputSchema: z.ZodType<Prisma.QuoteAttachmentScalarWhereInput> = z.strictObject({
  AND: z.union([ z.lazy(() => QuoteAttachmentScalarWhereInputSchema), z.lazy(() => QuoteAttachmentScalarWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => QuoteAttachmentScalarWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => QuoteAttachmentScalarWhereInputSchema), z.lazy(() => QuoteAttachmentScalarWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  quoteId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  fileName: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  fileSize: z.union([ z.lazy(() => IntFilterSchema), z.number() ]).optional(),
  mimeType: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  s3Key: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  s3Url: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  uploadedBy: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  uploadedAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
});

export default QuoteAttachmentScalarWhereInputSchema;
