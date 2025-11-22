import type { Prisma } from '@/prisma/client';

import { z } from 'zod';
import { CustomerCreateWithoutQuotesInputSchema } from './CustomerCreateWithoutQuotesInputSchema';
import { CustomerUncheckedCreateWithoutQuotesInputSchema } from './CustomerUncheckedCreateWithoutQuotesInputSchema';
import { CustomerCreateOrConnectWithoutQuotesInputSchema } from './CustomerCreateOrConnectWithoutQuotesInputSchema';
import { CustomerWhereUniqueInputSchema } from './CustomerWhereUniqueInputSchema';

export const CustomerCreateNestedOneWithoutQuotesInputSchema: z.ZodType<Prisma.CustomerCreateNestedOneWithoutQuotesInput> = z.strictObject({
  create: z.union([ z.lazy(() => CustomerCreateWithoutQuotesInputSchema), z.lazy(() => CustomerUncheckedCreateWithoutQuotesInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => CustomerCreateOrConnectWithoutQuotesInputSchema).optional(),
  connect: z.lazy(() => CustomerWhereUniqueInputSchema).optional(),
});

export default CustomerCreateNestedOneWithoutQuotesInputSchema;
