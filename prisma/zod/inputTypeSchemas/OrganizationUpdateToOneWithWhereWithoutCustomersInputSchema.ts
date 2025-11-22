import type { Prisma } from '@/prisma/client';

import { z } from 'zod';
import { OrganizationWhereInputSchema } from './OrganizationWhereInputSchema';
import { OrganizationUpdateWithoutCustomersInputSchema } from './OrganizationUpdateWithoutCustomersInputSchema';
import { OrganizationUncheckedUpdateWithoutCustomersInputSchema } from './OrganizationUncheckedUpdateWithoutCustomersInputSchema';

export const OrganizationUpdateToOneWithWhereWithoutCustomersInputSchema: z.ZodType<Prisma.OrganizationUpdateToOneWithWhereWithoutCustomersInput> = z.strictObject({
  where: z.lazy(() => OrganizationWhereInputSchema).optional(),
  data: z.union([ z.lazy(() => OrganizationUpdateWithoutCustomersInputSchema), z.lazy(() => OrganizationUncheckedUpdateWithoutCustomersInputSchema) ]),
});

export default OrganizationUpdateToOneWithWhereWithoutCustomersInputSchema;
