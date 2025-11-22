import type { Prisma } from '@/prisma/client';

import { z } from 'zod';
import { QuoteItemCreateWithoutProductInputSchema } from './QuoteItemCreateWithoutProductInputSchema';
import { QuoteItemUncheckedCreateWithoutProductInputSchema } from './QuoteItemUncheckedCreateWithoutProductInputSchema';
import { QuoteItemCreateOrConnectWithoutProductInputSchema } from './QuoteItemCreateOrConnectWithoutProductInputSchema';
import { QuoteItemUpsertWithWhereUniqueWithoutProductInputSchema } from './QuoteItemUpsertWithWhereUniqueWithoutProductInputSchema';
import { QuoteItemCreateManyProductInputEnvelopeSchema } from './QuoteItemCreateManyProductInputEnvelopeSchema';
import { QuoteItemWhereUniqueInputSchema } from './QuoteItemWhereUniqueInputSchema';
import { QuoteItemUpdateWithWhereUniqueWithoutProductInputSchema } from './QuoteItemUpdateWithWhereUniqueWithoutProductInputSchema';
import { QuoteItemUpdateManyWithWhereWithoutProductInputSchema } from './QuoteItemUpdateManyWithWhereWithoutProductInputSchema';
import { QuoteItemScalarWhereInputSchema } from './QuoteItemScalarWhereInputSchema';

export const QuoteItemUncheckedUpdateManyWithoutProductNestedInputSchema: z.ZodType<Prisma.QuoteItemUncheckedUpdateManyWithoutProductNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => QuoteItemCreateWithoutProductInputSchema), z.lazy(() => QuoteItemCreateWithoutProductInputSchema).array(), z.lazy(() => QuoteItemUncheckedCreateWithoutProductInputSchema), z.lazy(() => QuoteItemUncheckedCreateWithoutProductInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => QuoteItemCreateOrConnectWithoutProductInputSchema), z.lazy(() => QuoteItemCreateOrConnectWithoutProductInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => QuoteItemUpsertWithWhereUniqueWithoutProductInputSchema), z.lazy(() => QuoteItemUpsertWithWhereUniqueWithoutProductInputSchema).array() ]).optional(),
  createMany: z.lazy(() => QuoteItemCreateManyProductInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => QuoteItemWhereUniqueInputSchema), z.lazy(() => QuoteItemWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => QuoteItemWhereUniqueInputSchema), z.lazy(() => QuoteItemWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => QuoteItemWhereUniqueInputSchema), z.lazy(() => QuoteItemWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => QuoteItemWhereUniqueInputSchema), z.lazy(() => QuoteItemWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => QuoteItemUpdateWithWhereUniqueWithoutProductInputSchema), z.lazy(() => QuoteItemUpdateWithWhereUniqueWithoutProductInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => QuoteItemUpdateManyWithWhereWithoutProductInputSchema), z.lazy(() => QuoteItemUpdateManyWithWhereWithoutProductInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => QuoteItemScalarWhereInputSchema), z.lazy(() => QuoteItemScalarWhereInputSchema).array() ]).optional(),
});

export default QuoteItemUncheckedUpdateManyWithoutProductNestedInputSchema;
