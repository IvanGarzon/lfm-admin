import type { Prisma } from '@/prisma/client';

import { z } from 'zod';
import { CustomerCreateWithoutInvoicesInputSchema } from './CustomerCreateWithoutInvoicesInputSchema';
import { CustomerUncheckedCreateWithoutInvoicesInputSchema } from './CustomerUncheckedCreateWithoutInvoicesInputSchema';
import { CustomerCreateOrConnectWithoutInvoicesInputSchema } from './CustomerCreateOrConnectWithoutInvoicesInputSchema';
import { CustomerWhereUniqueInputSchema } from './CustomerWhereUniqueInputSchema';

export const CustomerCreateNestedOneWithoutInvoicesInputSchema: z.ZodType<Prisma.CustomerCreateNestedOneWithoutInvoicesInput> = z.strictObject({
  create: z.union([ z.lazy(() => CustomerCreateWithoutInvoicesInputSchema), z.lazy(() => CustomerUncheckedCreateWithoutInvoicesInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => CustomerCreateOrConnectWithoutInvoicesInputSchema).optional(),
  connect: z.lazy(() => CustomerWhereUniqueInputSchema).optional(),
});

export default CustomerCreateNestedOneWithoutInvoicesInputSchema;
