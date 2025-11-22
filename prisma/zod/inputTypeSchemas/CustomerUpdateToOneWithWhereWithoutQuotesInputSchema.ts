import type { Prisma } from '@/prisma/client';

import { z } from 'zod';
import { CustomerWhereInputSchema } from './CustomerWhereInputSchema';
import { CustomerUpdateWithoutQuotesInputSchema } from './CustomerUpdateWithoutQuotesInputSchema';
import { CustomerUncheckedUpdateWithoutQuotesInputSchema } from './CustomerUncheckedUpdateWithoutQuotesInputSchema';

export const CustomerUpdateToOneWithWhereWithoutQuotesInputSchema: z.ZodType<Prisma.CustomerUpdateToOneWithWhereWithoutQuotesInput> = z.strictObject({
  where: z.lazy(() => CustomerWhereInputSchema).optional(),
  data: z.union([ z.lazy(() => CustomerUpdateWithoutQuotesInputSchema), z.lazy(() => CustomerUncheckedUpdateWithoutQuotesInputSchema) ]),
});

export default CustomerUpdateToOneWithWhereWithoutQuotesInputSchema;
