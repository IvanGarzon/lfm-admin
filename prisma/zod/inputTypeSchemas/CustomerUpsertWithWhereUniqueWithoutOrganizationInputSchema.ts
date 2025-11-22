import type { Prisma } from '@/prisma/client';

import { z } from 'zod';
import { CustomerWhereUniqueInputSchema } from './CustomerWhereUniqueInputSchema';
import { CustomerUpdateWithoutOrganizationInputSchema } from './CustomerUpdateWithoutOrganizationInputSchema';
import { CustomerUncheckedUpdateWithoutOrganizationInputSchema } from './CustomerUncheckedUpdateWithoutOrganizationInputSchema';
import { CustomerCreateWithoutOrganizationInputSchema } from './CustomerCreateWithoutOrganizationInputSchema';
import { CustomerUncheckedCreateWithoutOrganizationInputSchema } from './CustomerUncheckedCreateWithoutOrganizationInputSchema';

export const CustomerUpsertWithWhereUniqueWithoutOrganizationInputSchema: z.ZodType<Prisma.CustomerUpsertWithWhereUniqueWithoutOrganizationInput> = z.strictObject({
  where: z.lazy(() => CustomerWhereUniqueInputSchema),
  update: z.union([ z.lazy(() => CustomerUpdateWithoutOrganizationInputSchema), z.lazy(() => CustomerUncheckedUpdateWithoutOrganizationInputSchema) ]),
  create: z.union([ z.lazy(() => CustomerCreateWithoutOrganizationInputSchema), z.lazy(() => CustomerUncheckedCreateWithoutOrganizationInputSchema) ]),
});

export default CustomerUpsertWithWhereUniqueWithoutOrganizationInputSchema;
