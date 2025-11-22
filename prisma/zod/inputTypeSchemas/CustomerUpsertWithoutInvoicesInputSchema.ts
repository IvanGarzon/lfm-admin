import type { Prisma } from '@/prisma/client';

import { z } from 'zod';
import { CustomerUpdateWithoutInvoicesInputSchema } from './CustomerUpdateWithoutInvoicesInputSchema';
import { CustomerUncheckedUpdateWithoutInvoicesInputSchema } from './CustomerUncheckedUpdateWithoutInvoicesInputSchema';
import { CustomerCreateWithoutInvoicesInputSchema } from './CustomerCreateWithoutInvoicesInputSchema';
import { CustomerUncheckedCreateWithoutInvoicesInputSchema } from './CustomerUncheckedCreateWithoutInvoicesInputSchema';
import { CustomerWhereInputSchema } from './CustomerWhereInputSchema';

export const CustomerUpsertWithoutInvoicesInputSchema: z.ZodType<Prisma.CustomerUpsertWithoutInvoicesInput> = z.strictObject({
  update: z.union([ z.lazy(() => CustomerUpdateWithoutInvoicesInputSchema), z.lazy(() => CustomerUncheckedUpdateWithoutInvoicesInputSchema) ]),
  create: z.union([ z.lazy(() => CustomerCreateWithoutInvoicesInputSchema), z.lazy(() => CustomerUncheckedCreateWithoutInvoicesInputSchema) ]),
  where: z.lazy(() => CustomerWhereInputSchema).optional(),
});

export default CustomerUpsertWithoutInvoicesInputSchema;
