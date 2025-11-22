import type { Prisma } from '@/prisma/client';

import { z } from 'zod';
import { StringFilterSchema } from './StringFilterSchema';
import { EnumGenderNullableFilterSchema } from './EnumGenderNullableFilterSchema';
import { GenderSchema } from './GenderSchema';
import { DateTimeNullableFilterSchema } from './DateTimeNullableFilterSchema';
import { FloatFilterSchema } from './FloatFilterSchema';
import { EnumEmployeeStatusFilterSchema } from './EnumEmployeeStatusFilterSchema';
import { EmployeeStatusSchema } from './EmployeeStatusSchema';
import { StringNullableFilterSchema } from './StringNullableFilterSchema';
import { DateTimeFilterSchema } from './DateTimeFilterSchema';

export const EmployeeWhereInputSchema: z.ZodType<Prisma.EmployeeWhereInput> = z.strictObject({
  AND: z.union([ z.lazy(() => EmployeeWhereInputSchema), z.lazy(() => EmployeeWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => EmployeeWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => EmployeeWhereInputSchema), z.lazy(() => EmployeeWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  firstName: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  lastName: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  email: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  phone: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  gender: z.union([ z.lazy(() => EnumGenderNullableFilterSchema), z.lazy(() => GenderSchema) ]).optional().nullable(),
  dob: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  rate: z.union([ z.lazy(() => FloatFilterSchema), z.number() ]).optional(),
  status: z.union([ z.lazy(() => EnumEmployeeStatusFilterSchema), z.lazy(() => EmployeeStatusSchema) ]).optional(),
  avatarUrl: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
});

export default EmployeeWhereInputSchema;
