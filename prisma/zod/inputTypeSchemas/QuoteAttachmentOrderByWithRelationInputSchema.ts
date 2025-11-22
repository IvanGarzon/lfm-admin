import type { Prisma } from '@/prisma/client';

import { z } from 'zod';
import { SortOrderSchema } from './SortOrderSchema';
import { SortOrderInputSchema } from './SortOrderInputSchema';
import { QuoteOrderByWithRelationInputSchema } from './QuoteOrderByWithRelationInputSchema';

export const QuoteAttachmentOrderByWithRelationInputSchema: z.ZodType<Prisma.QuoteAttachmentOrderByWithRelationInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  quoteId: z.lazy(() => SortOrderSchema).optional(),
  fileName: z.lazy(() => SortOrderSchema).optional(),
  fileSize: z.lazy(() => SortOrderSchema).optional(),
  mimeType: z.lazy(() => SortOrderSchema).optional(),
  s3Key: z.lazy(() => SortOrderSchema).optional(),
  s3Url: z.lazy(() => SortOrderSchema).optional(),
  uploadedBy: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  uploadedAt: z.lazy(() => SortOrderSchema).optional(),
  quote: z.lazy(() => QuoteOrderByWithRelationInputSchema).optional(),
});

export default QuoteAttachmentOrderByWithRelationInputSchema;
