import type { Prisma } from '@/prisma/client';

import { z } from 'zod';
import { QuoteItemCreateWithoutQuoteInputSchema } from './QuoteItemCreateWithoutQuoteInputSchema';
import { QuoteItemUncheckedCreateWithoutQuoteInputSchema } from './QuoteItemUncheckedCreateWithoutQuoteInputSchema';
import { QuoteItemCreateOrConnectWithoutQuoteInputSchema } from './QuoteItemCreateOrConnectWithoutQuoteInputSchema';
import { QuoteItemCreateManyQuoteInputEnvelopeSchema } from './QuoteItemCreateManyQuoteInputEnvelopeSchema';
import { QuoteItemWhereUniqueInputSchema } from './QuoteItemWhereUniqueInputSchema';

export const QuoteItemCreateNestedManyWithoutQuoteInputSchema: z.ZodType<Prisma.QuoteItemCreateNestedManyWithoutQuoteInput> = z.strictObject({
  create: z.union([ z.lazy(() => QuoteItemCreateWithoutQuoteInputSchema), z.lazy(() => QuoteItemCreateWithoutQuoteInputSchema).array(), z.lazy(() => QuoteItemUncheckedCreateWithoutQuoteInputSchema), z.lazy(() => QuoteItemUncheckedCreateWithoutQuoteInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => QuoteItemCreateOrConnectWithoutQuoteInputSchema), z.lazy(() => QuoteItemCreateOrConnectWithoutQuoteInputSchema).array() ]).optional(),
  createMany: z.lazy(() => QuoteItemCreateManyQuoteInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => QuoteItemWhereUniqueInputSchema), z.lazy(() => QuoteItemWhereUniqueInputSchema).array() ]).optional(),
});

export default QuoteItemCreateNestedManyWithoutQuoteInputSchema;
