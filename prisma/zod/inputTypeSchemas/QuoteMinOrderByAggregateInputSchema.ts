import type { Prisma } from '@/prisma/client';

import { z } from 'zod';
import { SortOrderSchema } from './SortOrderSchema';

export const QuoteMinOrderByAggregateInputSchema: z.ZodType<Prisma.QuoteMinOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  quoteNumber: z.lazy(() => SortOrderSchema).optional(),
  customerId: z.lazy(() => SortOrderSchema).optional(),
  status: z.lazy(() => SortOrderSchema).optional(),
  amount: z.lazy(() => SortOrderSchema).optional(),
  currency: z.lazy(() => SortOrderSchema).optional(),
  gst: z.lazy(() => SortOrderSchema).optional(),
  discount: z.lazy(() => SortOrderSchema).optional(),
  issuedDate: z.lazy(() => SortOrderSchema).optional(),
  validUntil: z.lazy(() => SortOrderSchema).optional(),
  acceptedDate: z.lazy(() => SortOrderSchema).optional(),
  rejectedDate: z.lazy(() => SortOrderSchema).optional(),
  rejectReason: z.lazy(() => SortOrderSchema).optional(),
  convertedDate: z.lazy(() => SortOrderSchema).optional(),
  invoiceId: z.lazy(() => SortOrderSchema).optional(),
  notes: z.lazy(() => SortOrderSchema).optional(),
  terms: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  deletedAt: z.lazy(() => SortOrderSchema).optional(),
});

export default QuoteMinOrderByAggregateInputSchema;
