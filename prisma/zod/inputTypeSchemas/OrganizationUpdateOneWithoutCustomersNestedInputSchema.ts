import type { Prisma } from '@/prisma/client';

import { z } from 'zod';
import { OrganizationCreateWithoutCustomersInputSchema } from './OrganizationCreateWithoutCustomersInputSchema';
import { OrganizationUncheckedCreateWithoutCustomersInputSchema } from './OrganizationUncheckedCreateWithoutCustomersInputSchema';
import { OrganizationCreateOrConnectWithoutCustomersInputSchema } from './OrganizationCreateOrConnectWithoutCustomersInputSchema';
import { OrganizationUpsertWithoutCustomersInputSchema } from './OrganizationUpsertWithoutCustomersInputSchema';
import { OrganizationWhereInputSchema } from './OrganizationWhereInputSchema';
import { OrganizationWhereUniqueInputSchema } from './OrganizationWhereUniqueInputSchema';
import { OrganizationUpdateToOneWithWhereWithoutCustomersInputSchema } from './OrganizationUpdateToOneWithWhereWithoutCustomersInputSchema';
import { OrganizationUpdateWithoutCustomersInputSchema } from './OrganizationUpdateWithoutCustomersInputSchema';
import { OrganizationUncheckedUpdateWithoutCustomersInputSchema } from './OrganizationUncheckedUpdateWithoutCustomersInputSchema';

export const OrganizationUpdateOneWithoutCustomersNestedInputSchema: z.ZodType<Prisma.OrganizationUpdateOneWithoutCustomersNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => OrganizationCreateWithoutCustomersInputSchema), z.lazy(() => OrganizationUncheckedCreateWithoutCustomersInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => OrganizationCreateOrConnectWithoutCustomersInputSchema).optional(),
  upsert: z.lazy(() => OrganizationUpsertWithoutCustomersInputSchema).optional(),
  disconnect: z.union([ z.boolean(),z.lazy(() => OrganizationWhereInputSchema) ]).optional(),
  delete: z.union([ z.boolean(),z.lazy(() => OrganizationWhereInputSchema) ]).optional(),
  connect: z.lazy(() => OrganizationWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => OrganizationUpdateToOneWithWhereWithoutCustomersInputSchema), z.lazy(() => OrganizationUpdateWithoutCustomersInputSchema), z.lazy(() => OrganizationUncheckedUpdateWithoutCustomersInputSchema) ]).optional(),
});

export default OrganizationUpdateOneWithoutCustomersNestedInputSchema;
