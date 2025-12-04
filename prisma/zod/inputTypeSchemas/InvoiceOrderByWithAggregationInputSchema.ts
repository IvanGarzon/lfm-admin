import type { Prisma } from '@/prisma/client';

import { z } from 'zod';
import { SortOrderSchema } from './SortOrderSchema';
import { SortOrderInputSchema } from './SortOrderInputSchema';
import { InvoiceCountOrderByAggregateInputSchema } from './InvoiceCountOrderByAggregateInputSchema';
import { InvoiceAvgOrderByAggregateInputSchema } from './InvoiceAvgOrderByAggregateInputSchema';
import { InvoiceMaxOrderByAggregateInputSchema } from './InvoiceMaxOrderByAggregateInputSchema';
import { InvoiceMinOrderByAggregateInputSchema } from './InvoiceMinOrderByAggregateInputSchema';
import { InvoiceSumOrderByAggregateInputSchema } from './InvoiceSumOrderByAggregateInputSchema';

export const InvoiceOrderByWithAggregationInputSchema: z.ZodType<Prisma.InvoiceOrderByWithAggregationInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  invoiceNumber: z.lazy(() => SortOrderSchema).optional(),
  customerId: z.lazy(() => SortOrderSchema).optional(),
  status: z.lazy(() => SortOrderSchema).optional(),
  amount: z.lazy(() => SortOrderSchema).optional(),
  currency: z.lazy(() => SortOrderSchema).optional(),
  discount: z.lazy(() => SortOrderSchema).optional(),
  gst: z.lazy(() => SortOrderSchema).optional(),
  issuedDate: z.lazy(() => SortOrderSchema).optional(),
  dueDate: z.lazy(() => SortOrderSchema).optional(),
  remindersSent: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  paidDate: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  paymentMethod: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  cancelledDate: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  cancelReason: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  notes: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  fileName: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  fileSize: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  mimeType: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  s3Key: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  s3Url: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  lastGeneratedAt: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  deletedAt: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  _count: z.lazy(() => InvoiceCountOrderByAggregateInputSchema).optional(),
  _avg: z.lazy(() => InvoiceAvgOrderByAggregateInputSchema).optional(),
  _max: z.lazy(() => InvoiceMaxOrderByAggregateInputSchema).optional(),
  _min: z.lazy(() => InvoiceMinOrderByAggregateInputSchema).optional(),
  _sum: z.lazy(() => InvoiceSumOrderByAggregateInputSchema).optional(),
});

export default InvoiceOrderByWithAggregationInputSchema;
