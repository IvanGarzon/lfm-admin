import type { Prisma } from '@/prisma/client';

import { z } from 'zod';
import { SortOrderSchema } from './SortOrderSchema';

export const EmployeeSumOrderByAggregateInputSchema: z.ZodType<Prisma.EmployeeSumOrderByAggregateInput> = z.strictObject({
  rate: z.lazy(() => SortOrderSchema).optional(),
});

export default EmployeeSumOrderByAggregateInputSchema;
