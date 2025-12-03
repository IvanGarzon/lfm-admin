import type { Prisma } from '@/prisma/client';

import { z } from 'zod';
import { SortOrderSchema } from './SortOrderSchema';

export const InvoiceSumOrderByAggregateInputSchema: z.ZodType<Prisma.InvoiceSumOrderByAggregateInput> = z.strictObject({
  amount: z.lazy(() => SortOrderSchema).optional(),
  discount: z.lazy(() => SortOrderSchema).optional(),
  gst: z.lazy(() => SortOrderSchema).optional(),
  remindersSent: z.lazy(() => SortOrderSchema).optional(),
  fileSize: z.lazy(() => SortOrderSchema).optional(),
});

export default InvoiceSumOrderByAggregateInputSchema;
