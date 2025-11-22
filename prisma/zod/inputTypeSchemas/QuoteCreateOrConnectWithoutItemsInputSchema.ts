import type { Prisma } from '@/prisma/client';

import { z } from 'zod';
import { QuoteWhereUniqueInputSchema } from './QuoteWhereUniqueInputSchema';
import { QuoteCreateWithoutItemsInputSchema } from './QuoteCreateWithoutItemsInputSchema';
import { QuoteUncheckedCreateWithoutItemsInputSchema } from './QuoteUncheckedCreateWithoutItemsInputSchema';

export const QuoteCreateOrConnectWithoutItemsInputSchema: z.ZodType<Prisma.QuoteCreateOrConnectWithoutItemsInput> = z.strictObject({
  where: z.lazy(() => QuoteWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => QuoteCreateWithoutItemsInputSchema), z.lazy(() => QuoteUncheckedCreateWithoutItemsInputSchema) ]),
});

export default QuoteCreateOrConnectWithoutItemsInputSchema;
