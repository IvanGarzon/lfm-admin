import type { Prisma } from '@/prisma/client';

import { z } from 'zod';
import { QuoteWhereUniqueInputSchema } from './QuoteWhereUniqueInputSchema';
import { QuoteUpdateWithoutCustomerInputSchema } from './QuoteUpdateWithoutCustomerInputSchema';
import { QuoteUncheckedUpdateWithoutCustomerInputSchema } from './QuoteUncheckedUpdateWithoutCustomerInputSchema';
import { QuoteCreateWithoutCustomerInputSchema } from './QuoteCreateWithoutCustomerInputSchema';
import { QuoteUncheckedCreateWithoutCustomerInputSchema } from './QuoteUncheckedCreateWithoutCustomerInputSchema';

export const QuoteUpsertWithWhereUniqueWithoutCustomerInputSchema: z.ZodType<Prisma.QuoteUpsertWithWhereUniqueWithoutCustomerInput> = z.strictObject({
  where: z.lazy(() => QuoteWhereUniqueInputSchema),
  update: z.union([ z.lazy(() => QuoteUpdateWithoutCustomerInputSchema), z.lazy(() => QuoteUncheckedUpdateWithoutCustomerInputSchema) ]),
  create: z.union([ z.lazy(() => QuoteCreateWithoutCustomerInputSchema), z.lazy(() => QuoteUncheckedCreateWithoutCustomerInputSchema) ]),
});

export default QuoteUpsertWithWhereUniqueWithoutCustomerInputSchema;
