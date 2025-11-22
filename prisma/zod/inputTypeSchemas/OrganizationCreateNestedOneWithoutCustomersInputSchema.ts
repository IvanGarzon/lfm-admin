import type { Prisma } from '@/prisma/client';

import { z } from 'zod';
import { OrganizationCreateWithoutCustomersInputSchema } from './OrganizationCreateWithoutCustomersInputSchema';
import { OrganizationUncheckedCreateWithoutCustomersInputSchema } from './OrganizationUncheckedCreateWithoutCustomersInputSchema';
import { OrganizationCreateOrConnectWithoutCustomersInputSchema } from './OrganizationCreateOrConnectWithoutCustomersInputSchema';
import { OrganizationWhereUniqueInputSchema } from './OrganizationWhereUniqueInputSchema';

export const OrganizationCreateNestedOneWithoutCustomersInputSchema: z.ZodType<Prisma.OrganizationCreateNestedOneWithoutCustomersInput> = z.strictObject({
  create: z.union([ z.lazy(() => OrganizationCreateWithoutCustomersInputSchema), z.lazy(() => OrganizationUncheckedCreateWithoutCustomersInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => OrganizationCreateOrConnectWithoutCustomersInputSchema).optional(),
  connect: z.lazy(() => OrganizationWhereUniqueInputSchema).optional(),
});

export default OrganizationCreateNestedOneWithoutCustomersInputSchema;
