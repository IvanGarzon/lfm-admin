import type { Prisma } from '@/prisma/client';

import { z } from 'zod';
import { InvoiceItemCreateWithoutProductInputSchema } from './InvoiceItemCreateWithoutProductInputSchema';
import { InvoiceItemUncheckedCreateWithoutProductInputSchema } from './InvoiceItemUncheckedCreateWithoutProductInputSchema';
import { InvoiceItemCreateOrConnectWithoutProductInputSchema } from './InvoiceItemCreateOrConnectWithoutProductInputSchema';
import { InvoiceItemUpsertWithWhereUniqueWithoutProductInputSchema } from './InvoiceItemUpsertWithWhereUniqueWithoutProductInputSchema';
import { InvoiceItemCreateManyProductInputEnvelopeSchema } from './InvoiceItemCreateManyProductInputEnvelopeSchema';
import { InvoiceItemWhereUniqueInputSchema } from './InvoiceItemWhereUniqueInputSchema';
import { InvoiceItemUpdateWithWhereUniqueWithoutProductInputSchema } from './InvoiceItemUpdateWithWhereUniqueWithoutProductInputSchema';
import { InvoiceItemUpdateManyWithWhereWithoutProductInputSchema } from './InvoiceItemUpdateManyWithWhereWithoutProductInputSchema';
import { InvoiceItemScalarWhereInputSchema } from './InvoiceItemScalarWhereInputSchema';

export const InvoiceItemUncheckedUpdateManyWithoutProductNestedInputSchema: z.ZodType<Prisma.InvoiceItemUncheckedUpdateManyWithoutProductNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => InvoiceItemCreateWithoutProductInputSchema), z.lazy(() => InvoiceItemCreateWithoutProductInputSchema).array(), z.lazy(() => InvoiceItemUncheckedCreateWithoutProductInputSchema), z.lazy(() => InvoiceItemUncheckedCreateWithoutProductInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => InvoiceItemCreateOrConnectWithoutProductInputSchema), z.lazy(() => InvoiceItemCreateOrConnectWithoutProductInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => InvoiceItemUpsertWithWhereUniqueWithoutProductInputSchema), z.lazy(() => InvoiceItemUpsertWithWhereUniqueWithoutProductInputSchema).array() ]).optional(),
  createMany: z.lazy(() => InvoiceItemCreateManyProductInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => InvoiceItemWhereUniqueInputSchema), z.lazy(() => InvoiceItemWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => InvoiceItemWhereUniqueInputSchema), z.lazy(() => InvoiceItemWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => InvoiceItemWhereUniqueInputSchema), z.lazy(() => InvoiceItemWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => InvoiceItemWhereUniqueInputSchema), z.lazy(() => InvoiceItemWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => InvoiceItemUpdateWithWhereUniqueWithoutProductInputSchema), z.lazy(() => InvoiceItemUpdateWithWhereUniqueWithoutProductInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => InvoiceItemUpdateManyWithWhereWithoutProductInputSchema), z.lazy(() => InvoiceItemUpdateManyWithWhereWithoutProductInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => InvoiceItemScalarWhereInputSchema), z.lazy(() => InvoiceItemScalarWhereInputSchema).array() ]).optional(),
});

export default InvoiceItemUncheckedUpdateManyWithoutProductNestedInputSchema;
