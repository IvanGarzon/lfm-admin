import type { Prisma } from '@/prisma/client';

import { z } from 'zod';
import { QuoteCreateWithoutItemsInputSchema } from './QuoteCreateWithoutItemsInputSchema';
import { QuoteUncheckedCreateWithoutItemsInputSchema } from './QuoteUncheckedCreateWithoutItemsInputSchema';
import { QuoteCreateOrConnectWithoutItemsInputSchema } from './QuoteCreateOrConnectWithoutItemsInputSchema';
import { QuoteWhereUniqueInputSchema } from './QuoteWhereUniqueInputSchema';

export const QuoteCreateNestedOneWithoutItemsInputSchema: z.ZodType<Prisma.QuoteCreateNestedOneWithoutItemsInput> = z.strictObject({
  create: z.union([ z.lazy(() => QuoteCreateWithoutItemsInputSchema), z.lazy(() => QuoteUncheckedCreateWithoutItemsInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => QuoteCreateOrConnectWithoutItemsInputSchema).optional(),
  connect: z.lazy(() => QuoteWhereUniqueInputSchema).optional(),
});

export default QuoteCreateNestedOneWithoutItemsInputSchema;
