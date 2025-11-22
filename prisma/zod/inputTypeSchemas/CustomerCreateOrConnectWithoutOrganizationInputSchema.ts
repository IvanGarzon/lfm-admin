import type { Prisma } from '@/prisma/client';

import { z } from 'zod';
import { CustomerWhereUniqueInputSchema } from './CustomerWhereUniqueInputSchema';
import { CustomerCreateWithoutOrganizationInputSchema } from './CustomerCreateWithoutOrganizationInputSchema';
import { CustomerUncheckedCreateWithoutOrganizationInputSchema } from './CustomerUncheckedCreateWithoutOrganizationInputSchema';

export const CustomerCreateOrConnectWithoutOrganizationInputSchema: z.ZodType<Prisma.CustomerCreateOrConnectWithoutOrganizationInput> = z.strictObject({
  where: z.lazy(() => CustomerWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => CustomerCreateWithoutOrganizationInputSchema), z.lazy(() => CustomerUncheckedCreateWithoutOrganizationInputSchema) ]),
});

export default CustomerCreateOrConnectWithoutOrganizationInputSchema;
