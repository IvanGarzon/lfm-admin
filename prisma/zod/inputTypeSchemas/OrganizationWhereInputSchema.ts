import type { Prisma } from '@/prisma/client';

import { z } from 'zod';
import { StringFilterSchema } from './StringFilterSchema';
import { StringNullableFilterSchema } from './StringNullableFilterSchema';
import { EnumStatesNullableFilterSchema } from './EnumStatesNullableFilterSchema';
import { StatesSchema } from './StatesSchema';
import { DateTimeFilterSchema } from './DateTimeFilterSchema';
import { CustomerListRelationFilterSchema } from './CustomerListRelationFilterSchema';

export const OrganizationWhereInputSchema: z.ZodType<Prisma.OrganizationWhereInput> = z.strictObject({
  AND: z.union([ z.lazy(() => OrganizationWhereInputSchema), z.lazy(() => OrganizationWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => OrganizationWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => OrganizationWhereInputSchema), z.lazy(() => OrganizationWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  name: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  address: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  city: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  state: z.union([ z.lazy(() => EnumStatesNullableFilterSchema), z.lazy(() => StatesSchema) ]).optional().nullable(),
  postcode: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  country: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  customers: z.lazy(() => CustomerListRelationFilterSchema).optional(),
});

export default OrganizationWhereInputSchema;
