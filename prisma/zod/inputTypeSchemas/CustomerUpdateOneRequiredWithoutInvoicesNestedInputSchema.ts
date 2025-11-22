import type { Prisma } from '@/prisma/client';

import { z } from 'zod';
import { CustomerCreateWithoutInvoicesInputSchema } from './CustomerCreateWithoutInvoicesInputSchema';
import { CustomerUncheckedCreateWithoutInvoicesInputSchema } from './CustomerUncheckedCreateWithoutInvoicesInputSchema';
import { CustomerCreateOrConnectWithoutInvoicesInputSchema } from './CustomerCreateOrConnectWithoutInvoicesInputSchema';
import { CustomerUpsertWithoutInvoicesInputSchema } from './CustomerUpsertWithoutInvoicesInputSchema';
import { CustomerWhereUniqueInputSchema } from './CustomerWhereUniqueInputSchema';
import { CustomerUpdateToOneWithWhereWithoutInvoicesInputSchema } from './CustomerUpdateToOneWithWhereWithoutInvoicesInputSchema';
import { CustomerUpdateWithoutInvoicesInputSchema } from './CustomerUpdateWithoutInvoicesInputSchema';
import { CustomerUncheckedUpdateWithoutInvoicesInputSchema } from './CustomerUncheckedUpdateWithoutInvoicesInputSchema';

export const CustomerUpdateOneRequiredWithoutInvoicesNestedInputSchema: z.ZodType<Prisma.CustomerUpdateOneRequiredWithoutInvoicesNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => CustomerCreateWithoutInvoicesInputSchema), z.lazy(() => CustomerUncheckedCreateWithoutInvoicesInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => CustomerCreateOrConnectWithoutInvoicesInputSchema).optional(),
  upsert: z.lazy(() => CustomerUpsertWithoutInvoicesInputSchema).optional(),
  connect: z.lazy(() => CustomerWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => CustomerUpdateToOneWithWhereWithoutInvoicesInputSchema), z.lazy(() => CustomerUpdateWithoutInvoicesInputSchema), z.lazy(() => CustomerUncheckedUpdateWithoutInvoicesInputSchema) ]).optional(),
});

export default CustomerUpdateOneRequiredWithoutInvoicesNestedInputSchema;
