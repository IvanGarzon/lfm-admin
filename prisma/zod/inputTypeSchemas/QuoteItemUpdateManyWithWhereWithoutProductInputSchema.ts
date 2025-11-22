import type { Prisma } from '@/prisma/client';

import { z } from 'zod';
import { QuoteItemScalarWhereInputSchema } from './QuoteItemScalarWhereInputSchema';
import { QuoteItemUpdateManyMutationInputSchema } from './QuoteItemUpdateManyMutationInputSchema';
import { QuoteItemUncheckedUpdateManyWithoutProductInputSchema } from './QuoteItemUncheckedUpdateManyWithoutProductInputSchema';

export const QuoteItemUpdateManyWithWhereWithoutProductInputSchema: z.ZodType<Prisma.QuoteItemUpdateManyWithWhereWithoutProductInput> = z.strictObject({
  where: z.lazy(() => QuoteItemScalarWhereInputSchema),
  data: z.union([ z.lazy(() => QuoteItemUpdateManyMutationInputSchema), z.lazy(() => QuoteItemUncheckedUpdateManyWithoutProductInputSchema) ]),
});

export default QuoteItemUpdateManyWithWhereWithoutProductInputSchema;
