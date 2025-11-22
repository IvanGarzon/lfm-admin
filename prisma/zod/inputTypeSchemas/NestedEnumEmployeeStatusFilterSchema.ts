import type { Prisma } from '@/prisma/client';

import { z } from 'zod';
import { EmployeeStatusSchema } from './EmployeeStatusSchema';

export const NestedEnumEmployeeStatusFilterSchema: z.ZodType<Prisma.NestedEnumEmployeeStatusFilter> = z.strictObject({
  equals: z.lazy(() => EmployeeStatusSchema).optional(),
  in: z.lazy(() => EmployeeStatusSchema).array().optional(),
  notIn: z.lazy(() => EmployeeStatusSchema).array().optional(),
  not: z.union([ z.lazy(() => EmployeeStatusSchema), z.lazy(() => NestedEnumEmployeeStatusFilterSchema) ]).optional(),
});

export default NestedEnumEmployeeStatusFilterSchema;
