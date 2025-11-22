import type { Prisma } from '@/prisma/client';

import { z } from 'zod';
import { QuoteItemCreateWithoutProductInputSchema } from './QuoteItemCreateWithoutProductInputSchema';
import { QuoteItemUncheckedCreateWithoutProductInputSchema } from './QuoteItemUncheckedCreateWithoutProductInputSchema';
import { QuoteItemCreateOrConnectWithoutProductInputSchema } from './QuoteItemCreateOrConnectWithoutProductInputSchema';
import { QuoteItemCreateManyProductInputEnvelopeSchema } from './QuoteItemCreateManyProductInputEnvelopeSchema';
import { QuoteItemWhereUniqueInputSchema } from './QuoteItemWhereUniqueInputSchema';

export const QuoteItemCreateNestedManyWithoutProductInputSchema: z.ZodType<Prisma.QuoteItemCreateNestedManyWithoutProductInput> = z.strictObject({
  create: z.union([ z.lazy(() => QuoteItemCreateWithoutProductInputSchema), z.lazy(() => QuoteItemCreateWithoutProductInputSchema).array(), z.lazy(() => QuoteItemUncheckedCreateWithoutProductInputSchema), z.lazy(() => QuoteItemUncheckedCreateWithoutProductInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => QuoteItemCreateOrConnectWithoutProductInputSchema), z.lazy(() => QuoteItemCreateOrConnectWithoutProductInputSchema).array() ]).optional(),
  createMany: z.lazy(() => QuoteItemCreateManyProductInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => QuoteItemWhereUniqueInputSchema), z.lazy(() => QuoteItemWhereUniqueInputSchema).array() ]).optional(),
});

export default QuoteItemCreateNestedManyWithoutProductInputSchema;
