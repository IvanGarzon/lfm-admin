import type { Prisma } from '@/prisma/client';

import { z } from 'zod';
import { CustomerCreateWithoutOrganizationInputSchema } from './CustomerCreateWithoutOrganizationInputSchema';
import { CustomerUncheckedCreateWithoutOrganizationInputSchema } from './CustomerUncheckedCreateWithoutOrganizationInputSchema';
import { CustomerCreateOrConnectWithoutOrganizationInputSchema } from './CustomerCreateOrConnectWithoutOrganizationInputSchema';
import { CustomerUpsertWithWhereUniqueWithoutOrganizationInputSchema } from './CustomerUpsertWithWhereUniqueWithoutOrganizationInputSchema';
import { CustomerCreateManyOrganizationInputEnvelopeSchema } from './CustomerCreateManyOrganizationInputEnvelopeSchema';
import { CustomerWhereUniqueInputSchema } from './CustomerWhereUniqueInputSchema';
import { CustomerUpdateWithWhereUniqueWithoutOrganizationInputSchema } from './CustomerUpdateWithWhereUniqueWithoutOrganizationInputSchema';
import { CustomerUpdateManyWithWhereWithoutOrganizationInputSchema } from './CustomerUpdateManyWithWhereWithoutOrganizationInputSchema';
import { CustomerScalarWhereInputSchema } from './CustomerScalarWhereInputSchema';

export const CustomerUpdateManyWithoutOrganizationNestedInputSchema: z.ZodType<Prisma.CustomerUpdateManyWithoutOrganizationNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => CustomerCreateWithoutOrganizationInputSchema), z.lazy(() => CustomerCreateWithoutOrganizationInputSchema).array(), z.lazy(() => CustomerUncheckedCreateWithoutOrganizationInputSchema), z.lazy(() => CustomerUncheckedCreateWithoutOrganizationInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => CustomerCreateOrConnectWithoutOrganizationInputSchema), z.lazy(() => CustomerCreateOrConnectWithoutOrganizationInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => CustomerUpsertWithWhereUniqueWithoutOrganizationInputSchema), z.lazy(() => CustomerUpsertWithWhereUniqueWithoutOrganizationInputSchema).array() ]).optional(),
  createMany: z.lazy(() => CustomerCreateManyOrganizationInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => CustomerWhereUniqueInputSchema), z.lazy(() => CustomerWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => CustomerWhereUniqueInputSchema), z.lazy(() => CustomerWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => CustomerWhereUniqueInputSchema), z.lazy(() => CustomerWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => CustomerWhereUniqueInputSchema), z.lazy(() => CustomerWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => CustomerUpdateWithWhereUniqueWithoutOrganizationInputSchema), z.lazy(() => CustomerUpdateWithWhereUniqueWithoutOrganizationInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => CustomerUpdateManyWithWhereWithoutOrganizationInputSchema), z.lazy(() => CustomerUpdateManyWithWhereWithoutOrganizationInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => CustomerScalarWhereInputSchema), z.lazy(() => CustomerScalarWhereInputSchema).array() ]).optional(),
});

export default CustomerUpdateManyWithoutOrganizationNestedInputSchema;
