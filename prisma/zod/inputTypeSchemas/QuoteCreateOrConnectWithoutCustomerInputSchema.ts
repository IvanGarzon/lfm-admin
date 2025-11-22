import type { Prisma } from '@/prisma/client';

import { z } from 'zod';
import { QuoteWhereUniqueInputSchema } from './QuoteWhereUniqueInputSchema';
import { QuoteCreateWithoutCustomerInputSchema } from './QuoteCreateWithoutCustomerInputSchema';
import { QuoteUncheckedCreateWithoutCustomerInputSchema } from './QuoteUncheckedCreateWithoutCustomerInputSchema';

export const QuoteCreateOrConnectWithoutCustomerInputSchema: z.ZodType<Prisma.QuoteCreateOrConnectWithoutCustomerInput> = z.strictObject({
  where: z.lazy(() => QuoteWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => QuoteCreateWithoutCustomerInputSchema), z.lazy(() => QuoteUncheckedCreateWithoutCustomerInputSchema) ]),
});

export default QuoteCreateOrConnectWithoutCustomerInputSchema;
