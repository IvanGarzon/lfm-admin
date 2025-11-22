import type { Prisma } from '@/prisma/client';

import { z } from 'zod';
import { QuoteItemWhereUniqueInputSchema } from './QuoteItemWhereUniqueInputSchema';
import { QuoteItemUpdateWithoutQuoteInputSchema } from './QuoteItemUpdateWithoutQuoteInputSchema';
import { QuoteItemUncheckedUpdateWithoutQuoteInputSchema } from './QuoteItemUncheckedUpdateWithoutQuoteInputSchema';
import { QuoteItemCreateWithoutQuoteInputSchema } from './QuoteItemCreateWithoutQuoteInputSchema';
import { QuoteItemUncheckedCreateWithoutQuoteInputSchema } from './QuoteItemUncheckedCreateWithoutQuoteInputSchema';

export const QuoteItemUpsertWithWhereUniqueWithoutQuoteInputSchema: z.ZodType<Prisma.QuoteItemUpsertWithWhereUniqueWithoutQuoteInput> = z.strictObject({
  where: z.lazy(() => QuoteItemWhereUniqueInputSchema),
  update: z.union([ z.lazy(() => QuoteItemUpdateWithoutQuoteInputSchema), z.lazy(() => QuoteItemUncheckedUpdateWithoutQuoteInputSchema) ]),
  create: z.union([ z.lazy(() => QuoteItemCreateWithoutQuoteInputSchema), z.lazy(() => QuoteItemUncheckedCreateWithoutQuoteInputSchema) ]),
});

export default QuoteItemUpsertWithWhereUniqueWithoutQuoteInputSchema;
