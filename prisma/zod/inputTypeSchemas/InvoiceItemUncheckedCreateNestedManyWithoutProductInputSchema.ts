import type { Prisma } from '@/prisma/client';

import { z } from 'zod';
import { InvoiceItemCreateWithoutProductInputSchema } from './InvoiceItemCreateWithoutProductInputSchema';
import { InvoiceItemUncheckedCreateWithoutProductInputSchema } from './InvoiceItemUncheckedCreateWithoutProductInputSchema';
import { InvoiceItemCreateOrConnectWithoutProductInputSchema } from './InvoiceItemCreateOrConnectWithoutProductInputSchema';
import { InvoiceItemCreateManyProductInputEnvelopeSchema } from './InvoiceItemCreateManyProductInputEnvelopeSchema';
import { InvoiceItemWhereUniqueInputSchema } from './InvoiceItemWhereUniqueInputSchema';

export const InvoiceItemUncheckedCreateNestedManyWithoutProductInputSchema: z.ZodType<Prisma.InvoiceItemUncheckedCreateNestedManyWithoutProductInput> = z.strictObject({
  create: z.union([ z.lazy(() => InvoiceItemCreateWithoutProductInputSchema), z.lazy(() => InvoiceItemCreateWithoutProductInputSchema).array(), z.lazy(() => InvoiceItemUncheckedCreateWithoutProductInputSchema), z.lazy(() => InvoiceItemUncheckedCreateWithoutProductInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => InvoiceItemCreateOrConnectWithoutProductInputSchema), z.lazy(() => InvoiceItemCreateOrConnectWithoutProductInputSchema).array() ]).optional(),
  createMany: z.lazy(() => InvoiceItemCreateManyProductInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => InvoiceItemWhereUniqueInputSchema), z.lazy(() => InvoiceItemWhereUniqueInputSchema).array() ]).optional(),
});

export default InvoiceItemUncheckedCreateNestedManyWithoutProductInputSchema;
