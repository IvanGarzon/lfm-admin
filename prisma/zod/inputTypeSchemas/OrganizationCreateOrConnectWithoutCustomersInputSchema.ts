import type { Prisma } from '@/prisma/client';

import { z } from 'zod';
import { OrganizationWhereUniqueInputSchema } from './OrganizationWhereUniqueInputSchema';
import { OrganizationCreateWithoutCustomersInputSchema } from './OrganizationCreateWithoutCustomersInputSchema';
import { OrganizationUncheckedCreateWithoutCustomersInputSchema } from './OrganizationUncheckedCreateWithoutCustomersInputSchema';

export const OrganizationCreateOrConnectWithoutCustomersInputSchema: z.ZodType<Prisma.OrganizationCreateOrConnectWithoutCustomersInput> = z.strictObject({
  where: z.lazy(() => OrganizationWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => OrganizationCreateWithoutCustomersInputSchema), z.lazy(() => OrganizationUncheckedCreateWithoutCustomersInputSchema) ]),
});

export default OrganizationCreateOrConnectWithoutCustomersInputSchema;
