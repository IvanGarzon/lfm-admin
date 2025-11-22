import type { Prisma } from '@/prisma/client';

import { z } from 'zod';
import { CustomerWhereUniqueInputSchema } from './CustomerWhereUniqueInputSchema';
import { CustomerCreateWithoutInvoicesInputSchema } from './CustomerCreateWithoutInvoicesInputSchema';
import { CustomerUncheckedCreateWithoutInvoicesInputSchema } from './CustomerUncheckedCreateWithoutInvoicesInputSchema';

export const CustomerCreateOrConnectWithoutInvoicesInputSchema: z.ZodType<Prisma.CustomerCreateOrConnectWithoutInvoicesInput> = z.strictObject({
  where: z.lazy(() => CustomerWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => CustomerCreateWithoutInvoicesInputSchema), z.lazy(() => CustomerUncheckedCreateWithoutInvoicesInputSchema) ]),
});

export default CustomerCreateOrConnectWithoutInvoicesInputSchema;
