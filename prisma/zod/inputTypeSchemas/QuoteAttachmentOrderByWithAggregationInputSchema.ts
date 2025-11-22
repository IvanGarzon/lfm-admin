import type { Prisma } from '@/prisma/client';

import { z } from 'zod';
import { SortOrderSchema } from './SortOrderSchema';
import { SortOrderInputSchema } from './SortOrderInputSchema';
import { QuoteAttachmentCountOrderByAggregateInputSchema } from './QuoteAttachmentCountOrderByAggregateInputSchema';
import { QuoteAttachmentAvgOrderByAggregateInputSchema } from './QuoteAttachmentAvgOrderByAggregateInputSchema';
import { QuoteAttachmentMaxOrderByAggregateInputSchema } from './QuoteAttachmentMaxOrderByAggregateInputSchema';
import { QuoteAttachmentMinOrderByAggregateInputSchema } from './QuoteAttachmentMinOrderByAggregateInputSchema';
import { QuoteAttachmentSumOrderByAggregateInputSchema } from './QuoteAttachmentSumOrderByAggregateInputSchema';

export const QuoteAttachmentOrderByWithAggregationInputSchema: z.ZodType<Prisma.QuoteAttachmentOrderByWithAggregationInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  quoteId: z.lazy(() => SortOrderSchema).optional(),
  fileName: z.lazy(() => SortOrderSchema).optional(),
  fileSize: z.lazy(() => SortOrderSchema).optional(),
  mimeType: z.lazy(() => SortOrderSchema).optional(),
  s3Key: z.lazy(() => SortOrderSchema).optional(),
  s3Url: z.lazy(() => SortOrderSchema).optional(),
  uploadedBy: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  uploadedAt: z.lazy(() => SortOrderSchema).optional(),
  _count: z.lazy(() => QuoteAttachmentCountOrderByAggregateInputSchema).optional(),
  _avg: z.lazy(() => QuoteAttachmentAvgOrderByAggregateInputSchema).optional(),
  _max: z.lazy(() => QuoteAttachmentMaxOrderByAggregateInputSchema).optional(),
  _min: z.lazy(() => QuoteAttachmentMinOrderByAggregateInputSchema).optional(),
  _sum: z.lazy(() => QuoteAttachmentSumOrderByAggregateInputSchema).optional(),
});

export default QuoteAttachmentOrderByWithAggregationInputSchema;
