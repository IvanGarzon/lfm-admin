import type { Prisma } from '@/prisma/client';

import { z } from 'zod';
import { CustomerWhereUniqueInputSchema } from './CustomerWhereUniqueInputSchema';
import { CustomerUpdateWithoutOrganizationInputSchema } from './CustomerUpdateWithoutOrganizationInputSchema';
import { CustomerUncheckedUpdateWithoutOrganizationInputSchema } from './CustomerUncheckedUpdateWithoutOrganizationInputSchema';

export const CustomerUpdateWithWhereUniqueWithoutOrganizationInputSchema: z.ZodType<Prisma.CustomerUpdateWithWhereUniqueWithoutOrganizationInput> = z.strictObject({
  where: z.lazy(() => CustomerWhereUniqueInputSchema),
  data: z.union([ z.lazy(() => CustomerUpdateWithoutOrganizationInputSchema), z.lazy(() => CustomerUncheckedUpdateWithoutOrganizationInputSchema) ]),
});

export default CustomerUpdateWithWhereUniqueWithoutOrganizationInputSchema;
