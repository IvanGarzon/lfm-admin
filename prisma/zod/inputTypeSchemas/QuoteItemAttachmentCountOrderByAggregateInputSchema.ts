import type { Prisma } from '@/prisma/client';

import { z } from 'zod';
import { SortOrderSchema } from './SortOrderSchema';

export const QuoteItemAttachmentCountOrderByAggregateInputSchema: z.ZodType<Prisma.QuoteItemAttachmentCountOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  quoteItemId: z.lazy(() => SortOrderSchema).optional(),
  fileName: z.lazy(() => SortOrderSchema).optional(),
  fileSize: z.lazy(() => SortOrderSchema).optional(),
  mimeType: z.lazy(() => SortOrderSchema).optional(),
  s3Key: z.lazy(() => SortOrderSchema).optional(),
  s3Url: z.lazy(() => SortOrderSchema).optional(),
  uploadedBy: z.lazy(() => SortOrderSchema).optional(),
  uploadedAt: z.lazy(() => SortOrderSchema).optional(),
});

export default QuoteItemAttachmentCountOrderByAggregateInputSchema;
