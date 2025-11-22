import type { Prisma } from '@/prisma/client';

import { z } from 'zod';
import { SortOrderSchema } from './SortOrderSchema';
import { SortOrderInputSchema } from './SortOrderInputSchema';
import { InvoiceItemCountOrderByAggregateInputSchema } from './InvoiceItemCountOrderByAggregateInputSchema';
import { InvoiceItemAvgOrderByAggregateInputSchema } from './InvoiceItemAvgOrderByAggregateInputSchema';
import { InvoiceItemMaxOrderByAggregateInputSchema } from './InvoiceItemMaxOrderByAggregateInputSchema';
import { InvoiceItemMinOrderByAggregateInputSchema } from './InvoiceItemMinOrderByAggregateInputSchema';
import { InvoiceItemSumOrderByAggregateInputSchema } from './InvoiceItemSumOrderByAggregateInputSchema';

export const InvoiceItemOrderByWithAggregationInputSchema: z.ZodType<Prisma.InvoiceItemOrderByWithAggregationInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  invoiceId: z.lazy(() => SortOrderSchema).optional(),
  description: z.lazy(() => SortOrderSchema).optional(),
  quantity: z.lazy(() => SortOrderSchema).optional(),
  unitPrice: z.lazy(() => SortOrderSchema).optional(),
  total: z.lazy(() => SortOrderSchema).optional(),
  productId: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  _count: z.lazy(() => InvoiceItemCountOrderByAggregateInputSchema).optional(),
  _avg: z.lazy(() => InvoiceItemAvgOrderByAggregateInputSchema).optional(),
  _max: z.lazy(() => InvoiceItemMaxOrderByAggregateInputSchema).optional(),
  _min: z.lazy(() => InvoiceItemMinOrderByAggregateInputSchema).optional(),
  _sum: z.lazy(() => InvoiceItemSumOrderByAggregateInputSchema).optional(),
});

export default InvoiceItemOrderByWithAggregationInputSchema;
