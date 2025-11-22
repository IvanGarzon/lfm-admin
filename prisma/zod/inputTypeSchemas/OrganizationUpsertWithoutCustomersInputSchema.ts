import type { Prisma } from '@/prisma/client';

import { z } from 'zod';
import { OrganizationUpdateWithoutCustomersInputSchema } from './OrganizationUpdateWithoutCustomersInputSchema';
import { OrganizationUncheckedUpdateWithoutCustomersInputSchema } from './OrganizationUncheckedUpdateWithoutCustomersInputSchema';
import { OrganizationCreateWithoutCustomersInputSchema } from './OrganizationCreateWithoutCustomersInputSchema';
import { OrganizationUncheckedCreateWithoutCustomersInputSchema } from './OrganizationUncheckedCreateWithoutCustomersInputSchema';
import { OrganizationWhereInputSchema } from './OrganizationWhereInputSchema';

export const OrganizationUpsertWithoutCustomersInputSchema: z.ZodType<Prisma.OrganizationUpsertWithoutCustomersInput> = z.strictObject({
  update: z.union([ z.lazy(() => OrganizationUpdateWithoutCustomersInputSchema), z.lazy(() => OrganizationUncheckedUpdateWithoutCustomersInputSchema) ]),
  create: z.union([ z.lazy(() => OrganizationCreateWithoutCustomersInputSchema), z.lazy(() => OrganizationUncheckedCreateWithoutCustomersInputSchema) ]),
  where: z.lazy(() => OrganizationWhereInputSchema).optional(),
});

export default OrganizationUpsertWithoutCustomersInputSchema;
