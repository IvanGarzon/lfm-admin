import type { Prisma } from '@/prisma/client';

import { z } from 'zod';
import { SortOrderSchema } from './SortOrderSchema';
import { SortOrderInputSchema } from './SortOrderInputSchema';
import { QuoteItemCountOrderByAggregateInputSchema } from './QuoteItemCountOrderByAggregateInputSchema';
import { QuoteItemAvgOrderByAggregateInputSchema } from './QuoteItemAvgOrderByAggregateInputSchema';
import { QuoteItemMaxOrderByAggregateInputSchema } from './QuoteItemMaxOrderByAggregateInputSchema';
import { QuoteItemMinOrderByAggregateInputSchema } from './QuoteItemMinOrderByAggregateInputSchema';
import { QuoteItemSumOrderByAggregateInputSchema } from './QuoteItemSumOrderByAggregateInputSchema';

export const QuoteItemOrderByWithAggregationInputSchema: z.ZodType<Prisma.QuoteItemOrderByWithAggregationInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  quoteId: z.lazy(() => SortOrderSchema).optional(),
  description: z.lazy(() => SortOrderSchema).optional(),
  quantity: z.lazy(() => SortOrderSchema).optional(),
  unitPrice: z.lazy(() => SortOrderSchema).optional(),
  total: z.lazy(() => SortOrderSchema).optional(),
  order: z.lazy(() => SortOrderSchema).optional(),
  productId: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  notes: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  colorPalette: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  _count: z.lazy(() => QuoteItemCountOrderByAggregateInputSchema).optional(),
  _avg: z.lazy(() => QuoteItemAvgOrderByAggregateInputSchema).optional(),
  _max: z.lazy(() => QuoteItemMaxOrderByAggregateInputSchema).optional(),
  _min: z.lazy(() => QuoteItemMinOrderByAggregateInputSchema).optional(),
  _sum: z.lazy(() => QuoteItemSumOrderByAggregateInputSchema).optional(),
});

export default QuoteItemOrderByWithAggregationInputSchema;
