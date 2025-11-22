import type { Prisma } from '@/prisma/client';

import { z } from 'zod';
import { CustomerUpdateWithoutQuotesInputSchema } from './CustomerUpdateWithoutQuotesInputSchema';
import { CustomerUncheckedUpdateWithoutQuotesInputSchema } from './CustomerUncheckedUpdateWithoutQuotesInputSchema';
import { CustomerCreateWithoutQuotesInputSchema } from './CustomerCreateWithoutQuotesInputSchema';
import { CustomerUncheckedCreateWithoutQuotesInputSchema } from './CustomerUncheckedCreateWithoutQuotesInputSchema';
import { CustomerWhereInputSchema } from './CustomerWhereInputSchema';

export const CustomerUpsertWithoutQuotesInputSchema: z.ZodType<Prisma.CustomerUpsertWithoutQuotesInput> = z.strictObject({
  update: z.union([ z.lazy(() => CustomerUpdateWithoutQuotesInputSchema), z.lazy(() => CustomerUncheckedUpdateWithoutQuotesInputSchema) ]),
  create: z.union([ z.lazy(() => CustomerCreateWithoutQuotesInputSchema), z.lazy(() => CustomerUncheckedCreateWithoutQuotesInputSchema) ]),
  where: z.lazy(() => CustomerWhereInputSchema).optional(),
});

export default CustomerUpsertWithoutQuotesInputSchema;
