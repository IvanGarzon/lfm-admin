import type { Prisma } from '@/prisma/client';

import { z } from 'zod';
import { CustomerWhereUniqueInputSchema } from './CustomerWhereUniqueInputSchema';
import { CustomerCreateWithoutQuotesInputSchema } from './CustomerCreateWithoutQuotesInputSchema';
import { CustomerUncheckedCreateWithoutQuotesInputSchema } from './CustomerUncheckedCreateWithoutQuotesInputSchema';

export const CustomerCreateOrConnectWithoutQuotesInputSchema: z.ZodType<Prisma.CustomerCreateOrConnectWithoutQuotesInput> = z.strictObject({
  where: z.lazy(() => CustomerWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => CustomerCreateWithoutQuotesInputSchema), z.lazy(() => CustomerUncheckedCreateWithoutQuotesInputSchema) ]),
});

export default CustomerCreateOrConnectWithoutQuotesInputSchema;
