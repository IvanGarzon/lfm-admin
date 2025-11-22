import type { Prisma } from '@/prisma/client';

import { z } from 'zod';
import { QuoteWhereUniqueInputSchema } from './QuoteWhereUniqueInputSchema';
import { QuoteUpdateWithoutCustomerInputSchema } from './QuoteUpdateWithoutCustomerInputSchema';
import { QuoteUncheckedUpdateWithoutCustomerInputSchema } from './QuoteUncheckedUpdateWithoutCustomerInputSchema';

export const QuoteUpdateWithWhereUniqueWithoutCustomerInputSchema: z.ZodType<Prisma.QuoteUpdateWithWhereUniqueWithoutCustomerInput> = z.strictObject({
  where: z.lazy(() => QuoteWhereUniqueInputSchema),
  data: z.union([ z.lazy(() => QuoteUpdateWithoutCustomerInputSchema), z.lazy(() => QuoteUncheckedUpdateWithoutCustomerInputSchema) ]),
});

export default QuoteUpdateWithWhereUniqueWithoutCustomerInputSchema;
