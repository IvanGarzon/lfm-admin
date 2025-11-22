import type { Prisma } from '@/prisma/client';

import { z } from 'zod';
import { CustomerCreateWithoutQuotesInputSchema } from './CustomerCreateWithoutQuotesInputSchema';
import { CustomerUncheckedCreateWithoutQuotesInputSchema } from './CustomerUncheckedCreateWithoutQuotesInputSchema';
import { CustomerCreateOrConnectWithoutQuotesInputSchema } from './CustomerCreateOrConnectWithoutQuotesInputSchema';
import { CustomerUpsertWithoutQuotesInputSchema } from './CustomerUpsertWithoutQuotesInputSchema';
import { CustomerWhereUniqueInputSchema } from './CustomerWhereUniqueInputSchema';
import { CustomerUpdateToOneWithWhereWithoutQuotesInputSchema } from './CustomerUpdateToOneWithWhereWithoutQuotesInputSchema';
import { CustomerUpdateWithoutQuotesInputSchema } from './CustomerUpdateWithoutQuotesInputSchema';
import { CustomerUncheckedUpdateWithoutQuotesInputSchema } from './CustomerUncheckedUpdateWithoutQuotesInputSchema';

export const CustomerUpdateOneRequiredWithoutQuotesNestedInputSchema: z.ZodType<Prisma.CustomerUpdateOneRequiredWithoutQuotesNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => CustomerCreateWithoutQuotesInputSchema), z.lazy(() => CustomerUncheckedCreateWithoutQuotesInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => CustomerCreateOrConnectWithoutQuotesInputSchema).optional(),
  upsert: z.lazy(() => CustomerUpsertWithoutQuotesInputSchema).optional(),
  connect: z.lazy(() => CustomerWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => CustomerUpdateToOneWithWhereWithoutQuotesInputSchema), z.lazy(() => CustomerUpdateWithoutQuotesInputSchema), z.lazy(() => CustomerUncheckedUpdateWithoutQuotesInputSchema) ]).optional(),
});

export default CustomerUpdateOneRequiredWithoutQuotesNestedInputSchema;
