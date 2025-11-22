import type { Prisma } from '@/prisma/client';

import { z } from 'zod';
import { InvoiceItemCreateWithoutInvoiceInputSchema } from './InvoiceItemCreateWithoutInvoiceInputSchema';
import { InvoiceItemUncheckedCreateWithoutInvoiceInputSchema } from './InvoiceItemUncheckedCreateWithoutInvoiceInputSchema';
import { InvoiceItemCreateOrConnectWithoutInvoiceInputSchema } from './InvoiceItemCreateOrConnectWithoutInvoiceInputSchema';
import { InvoiceItemCreateManyInvoiceInputEnvelopeSchema } from './InvoiceItemCreateManyInvoiceInputEnvelopeSchema';
import { InvoiceItemWhereUniqueInputSchema } from './InvoiceItemWhereUniqueInputSchema';

export const InvoiceItemUncheckedCreateNestedManyWithoutInvoiceInputSchema: z.ZodType<Prisma.InvoiceItemUncheckedCreateNestedManyWithoutInvoiceInput> = z.strictObject({
  create: z.union([ z.lazy(() => InvoiceItemCreateWithoutInvoiceInputSchema), z.lazy(() => InvoiceItemCreateWithoutInvoiceInputSchema).array(), z.lazy(() => InvoiceItemUncheckedCreateWithoutInvoiceInputSchema), z.lazy(() => InvoiceItemUncheckedCreateWithoutInvoiceInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => InvoiceItemCreateOrConnectWithoutInvoiceInputSchema), z.lazy(() => InvoiceItemCreateOrConnectWithoutInvoiceInputSchema).array() ]).optional(),
  createMany: z.lazy(() => InvoiceItemCreateManyInvoiceInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => InvoiceItemWhereUniqueInputSchema), z.lazy(() => InvoiceItemWhereUniqueInputSchema).array() ]).optional(),
});

export default InvoiceItemUncheckedCreateNestedManyWithoutInvoiceInputSchema;
