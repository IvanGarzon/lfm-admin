import type { Prisma } from '@/prisma/client';

import { z } from 'zod';
import { QuoteItemWhereUniqueInputSchema } from './QuoteItemWhereUniqueInputSchema';
import { QuoteItemCreateWithoutQuoteInputSchema } from './QuoteItemCreateWithoutQuoteInputSchema';
import { QuoteItemUncheckedCreateWithoutQuoteInputSchema } from './QuoteItemUncheckedCreateWithoutQuoteInputSchema';

export const QuoteItemCreateOrConnectWithoutQuoteInputSchema: z.ZodType<Prisma.QuoteItemCreateOrConnectWithoutQuoteInput> = z.strictObject({
  where: z.lazy(() => QuoteItemWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => QuoteItemCreateWithoutQuoteInputSchema), z.lazy(() => QuoteItemUncheckedCreateWithoutQuoteInputSchema) ]),
});

export default QuoteItemCreateOrConnectWithoutQuoteInputSchema;
