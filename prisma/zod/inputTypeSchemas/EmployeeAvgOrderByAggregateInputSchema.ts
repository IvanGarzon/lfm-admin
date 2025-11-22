import type { Prisma } from '@/prisma/client';

import { z } from 'zod';
import { SortOrderSchema } from './SortOrderSchema';

export const EmployeeAvgOrderByAggregateInputSchema: z.ZodType<Prisma.EmployeeAvgOrderByAggregateInput> = z.strictObject({
  rate: z.lazy(() => SortOrderSchema).optional(),
});

export default EmployeeAvgOrderByAggregateInputSchema;
