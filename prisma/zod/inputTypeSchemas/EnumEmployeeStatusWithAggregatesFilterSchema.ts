import type { Prisma } from '@/prisma/client';

import { z } from 'zod';
import { EmployeeStatusSchema } from './EmployeeStatusSchema';
import { NestedEnumEmployeeStatusWithAggregatesFilterSchema } from './NestedEnumEmployeeStatusWithAggregatesFilterSchema';
import { NestedIntFilterSchema } from './NestedIntFilterSchema';
import { NestedEnumEmployeeStatusFilterSchema } from './NestedEnumEmployeeStatusFilterSchema';

export const EnumEmployeeStatusWithAggregatesFilterSchema: z.ZodType<Prisma.EnumEmployeeStatusWithAggregatesFilter> = z.strictObject({
  equals: z.lazy(() => EmployeeStatusSchema).optional(),
  in: z.lazy(() => EmployeeStatusSchema).array().optional(),
  notIn: z.lazy(() => EmployeeStatusSchema).array().optional(),
  not: z.union([ z.lazy(() => EmployeeStatusSchema), z.lazy(() => NestedEnumEmployeeStatusWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedEnumEmployeeStatusFilterSchema).optional(),
  _max: z.lazy(() => NestedEnumEmployeeStatusFilterSchema).optional(),
});

export default EnumEmployeeStatusWithAggregatesFilterSchema;
