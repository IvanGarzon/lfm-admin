import type { Prisma } from '@/prisma/client';

import { z } from 'zod';
import { QuoteItemWhereUniqueInputSchema } from './QuoteItemWhereUniqueInputSchema';
import { QuoteItemUpdateWithoutQuoteInputSchema } from './QuoteItemUpdateWithoutQuoteInputSchema';
import { QuoteItemUncheckedUpdateWithoutQuoteInputSchema } from './QuoteItemUncheckedUpdateWithoutQuoteInputSchema';

export const QuoteItemUpdateWithWhereUniqueWithoutQuoteInputSchema: z.ZodType<Prisma.QuoteItemUpdateWithWhereUniqueWithoutQuoteInput> = z.strictObject({
  where: z.lazy(() => QuoteItemWhereUniqueInputSchema),
  data: z.union([ z.lazy(() => QuoteItemUpdateWithoutQuoteInputSchema), z.lazy(() => QuoteItemUncheckedUpdateWithoutQuoteInputSchema) ]),
});

export default QuoteItemUpdateWithWhereUniqueWithoutQuoteInputSchema;
