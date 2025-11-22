import type { Prisma } from '@/prisma/client';

import { z } from 'zod';
import { SortOrderSchema } from './SortOrderSchema';

export const InvoiceOrderByRelationAggregateInputSchema: z.ZodType<Prisma.InvoiceOrderByRelationAggregateInput> = z.strictObject({
  _count: z.lazy(() => SortOrderSchema).optional(),
});

export default InvoiceOrderByRelationAggregateInputSchema;
