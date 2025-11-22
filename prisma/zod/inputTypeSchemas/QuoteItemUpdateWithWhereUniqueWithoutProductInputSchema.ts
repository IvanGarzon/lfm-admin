import type { Prisma } from '@/prisma/client';

import { z } from 'zod';
import { QuoteItemWhereUniqueInputSchema } from './QuoteItemWhereUniqueInputSchema';
import { QuoteItemUpdateWithoutProductInputSchema } from './QuoteItemUpdateWithoutProductInputSchema';
import { QuoteItemUncheckedUpdateWithoutProductInputSchema } from './QuoteItemUncheckedUpdateWithoutProductInputSchema';

export const QuoteItemUpdateWithWhereUniqueWithoutProductInputSchema: z.ZodType<Prisma.QuoteItemUpdateWithWhereUniqueWithoutProductInput> = z.strictObject({
  where: z.lazy(() => QuoteItemWhereUniqueInputSchema),
  data: z.union([ z.lazy(() => QuoteItemUpdateWithoutProductInputSchema), z.lazy(() => QuoteItemUncheckedUpdateWithoutProductInputSchema) ]),
});

export default QuoteItemUpdateWithWhereUniqueWithoutProductInputSchema;
