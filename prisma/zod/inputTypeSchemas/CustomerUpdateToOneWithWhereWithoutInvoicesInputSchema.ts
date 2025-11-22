import type { Prisma } from '@/prisma/client';

import { z } from 'zod';
import { CustomerWhereInputSchema } from './CustomerWhereInputSchema';
import { CustomerUpdateWithoutInvoicesInputSchema } from './CustomerUpdateWithoutInvoicesInputSchema';
import { CustomerUncheckedUpdateWithoutInvoicesInputSchema } from './CustomerUncheckedUpdateWithoutInvoicesInputSchema';

export const CustomerUpdateToOneWithWhereWithoutInvoicesInputSchema: z.ZodType<Prisma.CustomerUpdateToOneWithWhereWithoutInvoicesInput> = z.strictObject({
  where: z.lazy(() => CustomerWhereInputSchema).optional(),
  data: z.union([ z.lazy(() => CustomerUpdateWithoutInvoicesInputSchema), z.lazy(() => CustomerUncheckedUpdateWithoutInvoicesInputSchema) ]),
});

export default CustomerUpdateToOneWithWhereWithoutInvoicesInputSchema;
