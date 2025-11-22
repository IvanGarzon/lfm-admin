import type { Prisma } from '@/prisma/client';

import { z } from 'zod';
import { QuoteScalarWhereInputSchema } from './QuoteScalarWhereInputSchema';
import { QuoteUpdateManyMutationInputSchema } from './QuoteUpdateManyMutationInputSchema';
import { QuoteUncheckedUpdateManyWithoutCustomerInputSchema } from './QuoteUncheckedUpdateManyWithoutCustomerInputSchema';

export const QuoteUpdateManyWithWhereWithoutCustomerInputSchema: z.ZodType<Prisma.QuoteUpdateManyWithWhereWithoutCustomerInput> = z.strictObject({
  where: z.lazy(() => QuoteScalarWhereInputSchema),
  data: z.union([ z.lazy(() => QuoteUpdateManyMutationInputSchema), z.lazy(() => QuoteUncheckedUpdateManyWithoutCustomerInputSchema) ]),
});

export default QuoteUpdateManyWithWhereWithoutCustomerInputSchema;
