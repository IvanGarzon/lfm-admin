import type { Prisma } from '@/prisma/client';

import { z } from 'zod';
import { SortOrderSchema } from './SortOrderSchema';
import { SortOrderInputSchema } from './SortOrderInputSchema';
import { CustomerOrderByWithRelationInputSchema } from './CustomerOrderByWithRelationInputSchema';
import { QuoteItemOrderByRelationAggregateInputSchema } from './QuoteItemOrderByRelationAggregateInputSchema';
import { QuoteAttachmentOrderByRelationAggregateInputSchema } from './QuoteAttachmentOrderByRelationAggregateInputSchema';

export const QuoteOrderByWithRelationInputSchema: z.ZodType<Prisma.QuoteOrderByWithRelationInput> = z.strictObject({
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
  acceptedDate: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  rejectedDate: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  rejectReason: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  convertedDate: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  invoiceId: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  notes: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  terms: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  deletedAt: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  customer: z.lazy(() => CustomerOrderByWithRelationInputSchema).optional(),
  items: z.lazy(() => QuoteItemOrderByRelationAggregateInputSchema).optional(),
  attachments: z.lazy(() => QuoteAttachmentOrderByRelationAggregateInputSchema).optional(),
});

export default QuoteOrderByWithRelationInputSchema;
