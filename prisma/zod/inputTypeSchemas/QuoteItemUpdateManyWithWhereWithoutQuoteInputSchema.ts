import type { Prisma } from '@/prisma/client';

import { z } from 'zod';
import { QuoteItemScalarWhereInputSchema } from './QuoteItemScalarWhereInputSchema';
import { QuoteItemUpdateManyMutationInputSchema } from './QuoteItemUpdateManyMutationInputSchema';
import { QuoteItemUncheckedUpdateManyWithoutQuoteInputSchema } from './QuoteItemUncheckedUpdateManyWithoutQuoteInputSchema';

export const QuoteItemUpdateManyWithWhereWithoutQuoteInputSchema: z.ZodType<Prisma.QuoteItemUpdateManyWithWhereWithoutQuoteInput> = z.strictObject({
  where: z.lazy(() => QuoteItemScalarWhereInputSchema),
  data: z.union([ z.lazy(() => QuoteItemUpdateManyMutationInputSchema), z.lazy(() => QuoteItemUncheckedUpdateManyWithoutQuoteInputSchema) ]),
});

export default QuoteItemUpdateManyWithWhereWithoutQuoteInputSchema;
