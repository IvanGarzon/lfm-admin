import type { Prisma } from '@/prisma/client';

import { z } from 'zod';
import { SortOrderSchema } from './SortOrderSchema';
import { SortOrderInputSchema } from './SortOrderInputSchema';
import { EmployeeCountOrderByAggregateInputSchema } from './EmployeeCountOrderByAggregateInputSchema';
import { EmployeeAvgOrderByAggregateInputSchema } from './EmployeeAvgOrderByAggregateInputSchema';
import { EmployeeMaxOrderByAggregateInputSchema } from './EmployeeMaxOrderByAggregateInputSchema';
import { EmployeeMinOrderByAggregateInputSchema } from './EmployeeMinOrderByAggregateInputSchema';
import { EmployeeSumOrderByAggregateInputSchema } from './EmployeeSumOrderByAggregateInputSchema';

export const EmployeeOrderByWithAggregationInputSchema: z.ZodType<Prisma.EmployeeOrderByWithAggregationInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  firstName: z.lazy(() => SortOrderSchema).optional(),
  lastName: z.lazy(() => SortOrderSchema).optional(),
  email: z.lazy(() => SortOrderSchema).optional(),
  phone: z.lazy(() => SortOrderSchema).optional(),
  gender: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  dob: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  rate: z.lazy(() => SortOrderSchema).optional(),
  status: z.lazy(() => SortOrderSchema).optional(),
  avatarUrl: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  _count: z.lazy(() => EmployeeCountOrderByAggregateInputSchema).optional(),
  _avg: z.lazy(() => EmployeeAvgOrderByAggregateInputSchema).optional(),
  _max: z.lazy(() => EmployeeMaxOrderByAggregateInputSchema).optional(),
  _min: z.lazy(() => EmployeeMinOrderByAggregateInputSchema).optional(),
  _sum: z.lazy(() => EmployeeSumOrderByAggregateInputSchema).optional(),
});

export default EmployeeOrderByWithAggregationInputSchema;
