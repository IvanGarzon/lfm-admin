import type { Prisma } from '@/prisma/client';

import { z } from 'zod';
import { SortOrderSchema } from './SortOrderSchema';
import { SortOrderInputSchema } from './SortOrderInputSchema';
import { AuditCountOrderByAggregateInputSchema } from './AuditCountOrderByAggregateInputSchema';
import { AuditMaxOrderByAggregateInputSchema } from './AuditMaxOrderByAggregateInputSchema';
import { AuditMinOrderByAggregateInputSchema } from './AuditMinOrderByAggregateInputSchema';

export const AuditOrderByWithAggregationInputSchema: z.ZodType<Prisma.AuditOrderByWithAggregationInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  userId: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  tag: z.lazy(() => SortOrderSchema).optional(),
  event: z.lazy(() => SortOrderSchema).optional(),
  message: z.lazy(() => SortOrderSchema).optional(),
  data: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  level: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  _count: z.lazy(() => AuditCountOrderByAggregateInputSchema).optional(),
  _max: z.lazy(() => AuditMaxOrderByAggregateInputSchema).optional(),
  _min: z.lazy(() => AuditMinOrderByAggregateInputSchema).optional(),
});

export default AuditOrderByWithAggregationInputSchema;
