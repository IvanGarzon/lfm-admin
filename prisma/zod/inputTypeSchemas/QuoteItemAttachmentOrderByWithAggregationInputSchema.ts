import type { Prisma } from '@/prisma/client';

import { z } from 'zod';
import { SortOrderSchema } from './SortOrderSchema';
import { SortOrderInputSchema } from './SortOrderInputSchema';
import { QuoteItemAttachmentCountOrderByAggregateInputSchema } from './QuoteItemAttachmentCountOrderByAggregateInputSchema';
import { QuoteItemAttachmentAvgOrderByAggregateInputSchema } from './QuoteItemAttachmentAvgOrderByAggregateInputSchema';
import { QuoteItemAttachmentMaxOrderByAggregateInputSchema } from './QuoteItemAttachmentMaxOrderByAggregateInputSchema';
import { QuoteItemAttachmentMinOrderByAggregateInputSchema } from './QuoteItemAttachmentMinOrderByAggregateInputSchema';
import { QuoteItemAttachmentSumOrderByAggregateInputSchema } from './QuoteItemAttachmentSumOrderByAggregateInputSchema';

export const QuoteItemAttachmentOrderByWithAggregationInputSchema: z.ZodType<Prisma.QuoteItemAttachmentOrderByWithAggregationInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  quoteItemId: z.lazy(() => SortOrderSchema).optional(),
  fileName: z.lazy(() => SortOrderSchema).optional(),
  fileSize: z.lazy(() => SortOrderSchema).optional(),
  mimeType: z.lazy(() => SortOrderSchema).optional(),
  s3Key: z.lazy(() => SortOrderSchema).optional(),
  s3Url: z.lazy(() => SortOrderSchema).optional(),
  uploadedBy: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  uploadedAt: z.lazy(() => SortOrderSchema).optional(),
  _count: z.lazy(() => QuoteItemAttachmentCountOrderByAggregateInputSchema).optional(),
  _avg: z.lazy(() => QuoteItemAttachmentAvgOrderByAggregateInputSchema).optional(),
  _max: z.lazy(() => QuoteItemAttachmentMaxOrderByAggregateInputSchema).optional(),
  _min: z.lazy(() => QuoteItemAttachmentMinOrderByAggregateInputSchema).optional(),
  _sum: z.lazy(() => QuoteItemAttachmentSumOrderByAggregateInputSchema).optional(),
});

export default QuoteItemAttachmentOrderByWithAggregationInputSchema;
