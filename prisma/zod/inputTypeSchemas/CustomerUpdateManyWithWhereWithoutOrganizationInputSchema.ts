import type { Prisma } from '@/prisma/client';

import { z } from 'zod';
import { CustomerScalarWhereInputSchema } from './CustomerScalarWhereInputSchema';
import { CustomerUpdateManyMutationInputSchema } from './CustomerUpdateManyMutationInputSchema';
import { CustomerUncheckedUpdateManyWithoutOrganizationInputSchema } from './CustomerUncheckedUpdateManyWithoutOrganizationInputSchema';

export const CustomerUpdateManyWithWhereWithoutOrganizationInputSchema: z.ZodType<Prisma.CustomerUpdateManyWithWhereWithoutOrganizationInput> = z.strictObject({
  where: z.lazy(() => CustomerScalarWhereInputSchema),
  data: z.union([ z.lazy(() => CustomerUpdateManyMutationInputSchema), z.lazy(() => CustomerUncheckedUpdateManyWithoutOrganizationInputSchema) ]),
});

export default CustomerUpdateManyWithWhereWithoutOrganizationInputSchema;
