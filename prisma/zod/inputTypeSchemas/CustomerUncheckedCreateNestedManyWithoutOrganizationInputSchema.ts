import type { Prisma } from '@/prisma/client';

import { z } from 'zod';
import { CustomerCreateWithoutOrganizationInputSchema } from './CustomerCreateWithoutOrganizationInputSchema';
import { CustomerUncheckedCreateWithoutOrganizationInputSchema } from './CustomerUncheckedCreateWithoutOrganizationInputSchema';
import { CustomerCreateOrConnectWithoutOrganizationInputSchema } from './CustomerCreateOrConnectWithoutOrganizationInputSchema';
import { CustomerCreateManyOrganizationInputEnvelopeSchema } from './CustomerCreateManyOrganizationInputEnvelopeSchema';
import { CustomerWhereUniqueInputSchema } from './CustomerWhereUniqueInputSchema';

export const CustomerUncheckedCreateNestedManyWithoutOrganizationInputSchema: z.ZodType<Prisma.CustomerUncheckedCreateNestedManyWithoutOrganizationInput> = z.strictObject({
  create: z.union([ z.lazy(() => CustomerCreateWithoutOrganizationInputSchema), z.lazy(() => CustomerCreateWithoutOrganizationInputSchema).array(), z.lazy(() => CustomerUncheckedCreateWithoutOrganizationInputSchema), z.lazy(() => CustomerUncheckedCreateWithoutOrganizationInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => CustomerCreateOrConnectWithoutOrganizationInputSchema), z.lazy(() => CustomerCreateOrConnectWithoutOrganizationInputSchema).array() ]).optional(),
  createMany: z.lazy(() => CustomerCreateManyOrganizationInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => CustomerWhereUniqueInputSchema), z.lazy(() => CustomerWhereUniqueInputSchema).array() ]).optional(),
});

export default CustomerUncheckedCreateNestedManyWithoutOrganizationInputSchema;
