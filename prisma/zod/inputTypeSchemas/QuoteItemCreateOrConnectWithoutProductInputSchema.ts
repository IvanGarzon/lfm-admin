import type { Prisma } from '@/prisma/client';

import { z } from 'zod';
import { QuoteItemWhereUniqueInputSchema } from './QuoteItemWhereUniqueInputSchema';
import { QuoteItemCreateWithoutProductInputSchema } from './QuoteItemCreateWithoutProductInputSchema';
import { QuoteItemUncheckedCreateWithoutProductInputSchema } from './QuoteItemUncheckedCreateWithoutProductInputSchema';

export const QuoteItemCreateOrConnectWithoutProductInputSchema: z.ZodType<Prisma.QuoteItemCreateOrConnectWithoutProductInput> = z.strictObject({
  where: z.lazy(() => QuoteItemWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => QuoteItemCreateWithoutProductInputSchema), z.lazy(() => QuoteItemUncheckedCreateWithoutProductInputSchema) ]),
});

export default QuoteItemCreateOrConnectWithoutProductInputSchema;
