import type { Prisma } from '@/prisma/client';

import { z } from 'zod';
import { StringFilterSchema } from './StringFilterSchema';
import { EnumGenderFilterSchema } from './EnumGenderFilterSchema';
import { GenderSchema } from './GenderSchema';
import { StringNullableFilterSchema } from './StringNullableFilterSchema';
import { EnumCustomerStatusFilterSchema } from './EnumCustomerStatusFilterSchema';
import { CustomerStatusSchema } from './CustomerStatusSchema';
import { DateTimeFilterSchema } from './DateTimeFilterSchema';
import { DateTimeNullableFilterSchema } from './DateTimeNullableFilterSchema';

export const CustomerScalarWhereInputSchema: z.ZodType<Prisma.CustomerScalarWhereInput> = z.strictObject({
  AND: z.union([ z.lazy(() => CustomerScalarWhereInputSchema), z.lazy(() => CustomerScalarWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => CustomerScalarWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => CustomerScalarWhereInputSchema), z.lazy(() => CustomerScalarWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  firstName: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  lastName: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  gender: z.union([ z.lazy(() => EnumGenderFilterSchema), z.lazy(() => GenderSchema) ]).optional(),
  email: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  phone: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  status: z.union([ z.lazy(() => EnumCustomerStatusFilterSchema), z.lazy(() => CustomerStatusSchema) ]).optional(),
  organizationId: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  deletedAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
});

export default CustomerScalarWhereInputSchema;
