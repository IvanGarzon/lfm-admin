import type { Prisma } from '@/prisma/client';

import { z } from 'zod';
import { InvoiceItemWhereUniqueInputSchema } from './InvoiceItemWhereUniqueInputSchema';
import { InvoiceItemCreateWithoutInvoiceInputSchema } from './InvoiceItemCreateWithoutInvoiceInputSchema';
import { InvoiceItemUncheckedCreateWithoutInvoiceInputSchema } from './InvoiceItemUncheckedCreateWithoutInvoiceInputSchema';

export const InvoiceItemCreateOrConnectWithoutInvoiceInputSchema: z.ZodType<Prisma.InvoiceItemCreateOrConnectWithoutInvoiceInput> = z.strictObject({
  where: z.lazy(() => InvoiceItemWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => InvoiceItemCreateWithoutInvoiceInputSchema), z.lazy(() => InvoiceItemUncheckedCreateWithoutInvoiceInputSchema) ]),
});

export default InvoiceItemCreateOrConnectWithoutInvoiceInputSchema;
