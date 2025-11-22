import type { Prisma } from '@/prisma/client';

import { z } from 'zod';
import { InvoiceItemCreateWithoutInvoiceInputSchema } from './InvoiceItemCreateWithoutInvoiceInputSchema';
import { InvoiceItemUncheckedCreateWithoutInvoiceInputSchema } from './InvoiceItemUncheckedCreateWithoutInvoiceInputSchema';
import { InvoiceItemCreateOrConnectWithoutInvoiceInputSchema } from './InvoiceItemCreateOrConnectWithoutInvoiceInputSchema';
import { InvoiceItemUpsertWithWhereUniqueWithoutInvoiceInputSchema } from './InvoiceItemUpsertWithWhereUniqueWithoutInvoiceInputSchema';
import { InvoiceItemCreateManyInvoiceInputEnvelopeSchema } from './InvoiceItemCreateManyInvoiceInputEnvelopeSchema';
import { InvoiceItemWhereUniqueInputSchema } from './InvoiceItemWhereUniqueInputSchema';
import { InvoiceItemUpdateWithWhereUniqueWithoutInvoiceInputSchema } from './InvoiceItemUpdateWithWhereUniqueWithoutInvoiceInputSchema';
import { InvoiceItemUpdateManyWithWhereWithoutInvoiceInputSchema } from './InvoiceItemUpdateManyWithWhereWithoutInvoiceInputSchema';
import { InvoiceItemScalarWhereInputSchema } from './InvoiceItemScalarWhereInputSchema';

export const InvoiceItemUncheckedUpdateManyWithoutInvoiceNestedInputSchema: z.ZodType<Prisma.InvoiceItemUncheckedUpdateManyWithoutInvoiceNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => InvoiceItemCreateWithoutInvoiceInputSchema), z.lazy(() => InvoiceItemCreateWithoutInvoiceInputSchema).array(), z.lazy(() => InvoiceItemUncheckedCreateWithoutInvoiceInputSchema), z.lazy(() => InvoiceItemUncheckedCreateWithoutInvoiceInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => InvoiceItemCreateOrConnectWithoutInvoiceInputSchema), z.lazy(() => InvoiceItemCreateOrConnectWithoutInvoiceInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => InvoiceItemUpsertWithWhereUniqueWithoutInvoiceInputSchema), z.lazy(() => InvoiceItemUpsertWithWhereUniqueWithoutInvoiceInputSchema).array() ]).optional(),
  createMany: z.lazy(() => InvoiceItemCreateManyInvoiceInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => InvoiceItemWhereUniqueInputSchema), z.lazy(() => InvoiceItemWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => InvoiceItemWhereUniqueInputSchema), z.lazy(() => InvoiceItemWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => InvoiceItemWhereUniqueInputSchema), z.lazy(() => InvoiceItemWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => InvoiceItemWhereUniqueInputSchema), z.lazy(() => InvoiceItemWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => InvoiceItemUpdateWithWhereUniqueWithoutInvoiceInputSchema), z.lazy(() => InvoiceItemUpdateWithWhereUniqueWithoutInvoiceInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => InvoiceItemUpdateManyWithWhereWithoutInvoiceInputSchema), z.lazy(() => InvoiceItemUpdateManyWithWhereWithoutInvoiceInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => InvoiceItemScalarWhereInputSchema), z.lazy(() => InvoiceItemScalarWhereInputSchema).array() ]).optional(),
});

export default InvoiceItemUncheckedUpdateManyWithoutInvoiceNestedInputSchema;
