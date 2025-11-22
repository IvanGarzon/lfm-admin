import type { Prisma } from '@/prisma/client';

import { z } from 'zod';
import { SortOrderSchema } from './SortOrderSchema';

export const InvoiceItemOrderByRelationAggregateInputSchema: z.ZodType<Prisma.InvoiceItemOrderByRelationAggregateInput> = z.strictObject({
  _count: z.lazy(() => SortOrderSchema).optional(),
});

export default InvoiceItemOrderByRelationAggregateInputSchema;
