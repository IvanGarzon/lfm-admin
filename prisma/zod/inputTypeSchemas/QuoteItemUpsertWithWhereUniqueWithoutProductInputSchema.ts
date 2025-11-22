import type { Prisma } from '@/prisma/client';

import { z } from 'zod';
import { QuoteItemWhereUniqueInputSchema } from './QuoteItemWhereUniqueInputSchema';
import { QuoteItemUpdateWithoutProductInputSchema } from './QuoteItemUpdateWithoutProductInputSchema';
import { QuoteItemUncheckedUpdateWithoutProductInputSchema } from './QuoteItemUncheckedUpdateWithoutProductInputSchema';
import { QuoteItemCreateWithoutProductInputSchema } from './QuoteItemCreateWithoutProductInputSchema';
import { QuoteItemUncheckedCreateWithoutProductInputSchema } from './QuoteItemUncheckedCreateWithoutProductInputSchema';

export const QuoteItemUpsertWithWhereUniqueWithoutProductInputSchema: z.ZodType<Prisma.QuoteItemUpsertWithWhereUniqueWithoutProductInput> = z.strictObject({
  where: z.lazy(() => QuoteItemWhereUniqueInputSchema),
  update: z.union([ z.lazy(() => QuoteItemUpdateWithoutProductInputSchema), z.lazy(() => QuoteItemUncheckedUpdateWithoutProductInputSchema) ]),
  create: z.union([ z.lazy(() => QuoteItemCreateWithoutProductInputSchema), z.lazy(() => QuoteItemUncheckedCreateWithoutProductInputSchema) ]),
});

export default QuoteItemUpsertWithWhereUniqueWithoutProductInputSchema;
