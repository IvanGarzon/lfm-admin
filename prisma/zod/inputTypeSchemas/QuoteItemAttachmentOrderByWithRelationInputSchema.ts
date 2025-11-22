import type { Prisma } from '@/prisma/client';

import { z } from 'zod';
import { SortOrderSchema } from './SortOrderSchema';
import { SortOrderInputSchema } from './SortOrderInputSchema';
import { QuoteItemOrderByWithRelationInputSchema } from './QuoteItemOrderByWithRelationInputSchema';

export const QuoteItemAttachmentOrderByWithRelationInputSchema: z.ZodType<Prisma.QuoteItemAttachmentOrderByWithRelationInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  quoteItemId: z.lazy(() => SortOrderSchema).optional(),
  fileName: z.lazy(() => SortOrderSchema).optional(),
  fileSize: z.lazy(() => SortOrderSchema).optional(),
  mimeType: z.lazy(() => SortOrderSchema).optional(),
  s3Key: z.lazy(() => SortOrderSchema).optional(),
  s3Url: z.lazy(() => SortOrderSchema).optional(),
  uploadedBy: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  uploadedAt: z.lazy(() => SortOrderSchema).optional(),
  quoteItem: z.lazy(() => QuoteItemOrderByWithRelationInputSchema).optional(),
});

export default QuoteItemAttachmentOrderByWithRelationInputSchema;
