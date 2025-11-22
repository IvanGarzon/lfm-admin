import type { Prisma } from '@/prisma/client';

import { z } from 'zod';
import { InvoiceItemWhereUniqueInputSchema } from './InvoiceItemWhereUniqueInputSchema';
import { InvoiceItemUpdateWithoutInvoiceInputSchema } from './InvoiceItemUpdateWithoutInvoiceInputSchema';
import { InvoiceItemUncheckedUpdateWithoutInvoiceInputSchema } from './InvoiceItemUncheckedUpdateWithoutInvoiceInputSchema';
import { InvoiceItemCreateWithoutInvoiceInputSchema } from './InvoiceItemCreateWithoutInvoiceInputSchema';
import { InvoiceItemUncheckedCreateWithoutInvoiceInputSchema } from './InvoiceItemUncheckedCreateWithoutInvoiceInputSchema';

export const InvoiceItemUpsertWithWhereUniqueWithoutInvoiceInputSchema: z.ZodType<Prisma.InvoiceItemUpsertWithWhereUniqueWithoutInvoiceInput> = z.strictObject({
  where: z.lazy(() => InvoiceItemWhereUniqueInputSchema),
  update: z.union([ z.lazy(() => InvoiceItemUpdateWithoutInvoiceInputSchema), z.lazy(() => InvoiceItemUncheckedUpdateWithoutInvoiceInputSchema) ]),
  create: z.union([ z.lazy(() => InvoiceItemCreateWithoutInvoiceInputSchema), z.lazy(() => InvoiceItemUncheckedCreateWithoutInvoiceInputSchema) ]),
});

export default InvoiceItemUpsertWithWhereUniqueWithoutInvoiceInputSchema;
