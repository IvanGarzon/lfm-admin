import type { Prisma } from '@/prisma/client';

import { z } from 'zod';
import { QuoteItemCreateWithoutQuoteInputSchema } from './QuoteItemCreateWithoutQuoteInputSchema';
import { QuoteItemUncheckedCreateWithoutQuoteInputSchema } from './QuoteItemUncheckedCreateWithoutQuoteInputSchema';
import { QuoteItemCreateOrConnectWithoutQuoteInputSchema } from './QuoteItemCreateOrConnectWithoutQuoteInputSchema';
import { QuoteItemUpsertWithWhereUniqueWithoutQuoteInputSchema } from './QuoteItemUpsertWithWhereUniqueWithoutQuoteInputSchema';
import { QuoteItemCreateManyQuoteInputEnvelopeSchema } from './QuoteItemCreateManyQuoteInputEnvelopeSchema';
import { QuoteItemWhereUniqueInputSchema } from './QuoteItemWhereUniqueInputSchema';
import { QuoteItemUpdateWithWhereUniqueWithoutQuoteInputSchema } from './QuoteItemUpdateWithWhereUniqueWithoutQuoteInputSchema';
import { QuoteItemUpdateManyWithWhereWithoutQuoteInputSchema } from './QuoteItemUpdateManyWithWhereWithoutQuoteInputSchema';
import { QuoteItemScalarWhereInputSchema } from './QuoteItemScalarWhereInputSchema';

export const QuoteItemUpdateManyWithoutQuoteNestedInputSchema: z.ZodType<Prisma.QuoteItemUpdateManyWithoutQuoteNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => QuoteItemCreateWithoutQuoteInputSchema), z.lazy(() => QuoteItemCreateWithoutQuoteInputSchema).array(), z.lazy(() => QuoteItemUncheckedCreateWithoutQuoteInputSchema), z.lazy(() => QuoteItemUncheckedCreateWithoutQuoteInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => QuoteItemCreateOrConnectWithoutQuoteInputSchema), z.lazy(() => QuoteItemCreateOrConnectWithoutQuoteInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => QuoteItemUpsertWithWhereUniqueWithoutQuoteInputSchema), z.lazy(() => QuoteItemUpsertWithWhereUniqueWithoutQuoteInputSchema).array() ]).optional(),
  createMany: z.lazy(() => QuoteItemCreateManyQuoteInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => QuoteItemWhereUniqueInputSchema), z.lazy(() => QuoteItemWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => QuoteItemWhereUniqueInputSchema), z.lazy(() => QuoteItemWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => QuoteItemWhereUniqueInputSchema), z.lazy(() => QuoteItemWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => QuoteItemWhereUniqueInputSchema), z.lazy(() => QuoteItemWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => QuoteItemUpdateWithWhereUniqueWithoutQuoteInputSchema), z.lazy(() => QuoteItemUpdateWithWhereUniqueWithoutQuoteInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => QuoteItemUpdateManyWithWhereWithoutQuoteInputSchema), z.lazy(() => QuoteItemUpdateManyWithWhereWithoutQuoteInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => QuoteItemScalarWhereInputSchema), z.lazy(() => QuoteItemScalarWhereInputSchema).array() ]).optional(),
});

export default QuoteItemUpdateManyWithoutQuoteNestedInputSchema;
