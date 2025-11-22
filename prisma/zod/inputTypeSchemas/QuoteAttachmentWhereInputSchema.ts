import type { Prisma } from '@/prisma/client';

import { z } from 'zod';
import { StringFilterSchema } from './StringFilterSchema';
import { IntFilterSchema } from './IntFilterSchema';
import { StringNullableFilterSchema } from './StringNullableFilterSchema';
import { DateTimeFilterSchema } from './DateTimeFilterSchema';
import { QuoteScalarRelationFilterSchema } from './QuoteScalarRelationFilterSchema';
import { QuoteWhereInputSchema } from './QuoteWhereInputSchema';

export const QuoteAttachmentWhereInputSchema: z.ZodType<Prisma.QuoteAttachmentWhereInput> = z.strictObject({
  AND: z.union([ z.lazy(() => QuoteAttachmentWhereInputSchema), z.lazy(() => QuoteAttachmentWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => QuoteAttachmentWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => QuoteAttachmentWhereInputSchema), z.lazy(() => QuoteAttachmentWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  quoteId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  fileName: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  fileSize: z.union([ z.lazy(() => IntFilterSchema), z.number() ]).optional(),
  mimeType: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  s3Key: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  s3Url: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  uploadedBy: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  uploadedAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  quote: z.union([ z.lazy(() => QuoteScalarRelationFilterSchema), z.lazy(() => QuoteWhereInputSchema) ]).optional(),
});

export default QuoteAttachmentWhereInputSchema;
