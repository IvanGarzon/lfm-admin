import type { Prisma } from '@/prisma/client';

import { z } from 'zod';
import { EmployeeWhereInputSchema } from './EmployeeWhereInputSchema';
import { StringFilterSchema } from './StringFilterSchema';
import { EnumGenderNullableFilterSchema } from './EnumGenderNullableFilterSchema';
import { GenderSchema } from './GenderSchema';
import { DateTimeNullableFilterSchema } from './DateTimeNullableFilterSchema';
import { FloatFilterSchema } from './FloatFilterSchema';
import { EnumEmployeeStatusFilterSchema } from './EnumEmployeeStatusFilterSchema';
import { EmployeeStatusSchema } from './EmployeeStatusSchema';
import { StringNullableFilterSchema } from './StringNullableFilterSchema';
import { DateTimeFilterSchema } from './DateTimeFilterSchema';

export const EmployeeWhereUniqueInputSchema: z.ZodType<Prisma.EmployeeWhereUniqueInput> = z.union([
  z.object({
    id: z.cuid(),
    email: z.string(),
  }),
  z.object({
    id: z.cuid(),
  }),
  z.object({
    email: z.string(),
  }),
])
.and(z.strictObject({
  id: z.cuid().optional(),
  email: z.string().optional(),
  AND: z.union([ z.lazy(() => EmployeeWhereInputSchema), z.lazy(() => EmployeeWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => EmployeeWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => EmployeeWhereInputSchema), z.lazy(() => EmployeeWhereInputSchema).array() ]).optional(),
  firstName: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  lastName: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  phone: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  gender: z.union([ z.lazy(() => EnumGenderNullableFilterSchema), z.lazy(() => GenderSchema) ]).optional().nullable(),
  dob: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  rate: z.union([ z.lazy(() => FloatFilterSchema), z.number() ]).optional(),
  status: z.union([ z.lazy(() => EnumEmployeeStatusFilterSchema), z.lazy(() => EmployeeStatusSchema) ]).optional(),
  avatarUrl: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
}));

export default EmployeeWhereUniqueInputSchema;
