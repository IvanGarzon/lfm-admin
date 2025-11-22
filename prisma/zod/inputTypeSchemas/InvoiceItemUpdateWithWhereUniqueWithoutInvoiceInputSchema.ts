import type { Prisma } from '@/prisma/client';

import { z } from 'zod';
import { InvoiceItemWhereUniqueInputSchema } from './InvoiceItemWhereUniqueInputSchema';
import { InvoiceItemUpdateWithoutInvoiceInputSchema } from './InvoiceItemUpdateWithoutInvoiceInputSchema';
import { InvoiceItemUncheckedUpdateWithoutInvoiceInputSchema } from './InvoiceItemUncheckedUpdateWithoutInvoiceInputSchema';

export const InvoiceItemUpdateWithWhereUniqueWithoutInvoiceInputSchema: z.ZodType<Prisma.InvoiceItemUpdateWithWhereUniqueWithoutInvoiceInput> = z.strictObject({
  where: z.lazy(() => InvoiceItemWhereUniqueInputSchema),
  data: z.union([ z.lazy(() => InvoiceItemUpdateWithoutInvoiceInputSchema), z.lazy(() => InvoiceItemUncheckedUpdateWithoutInvoiceInputSchema) ]),
});

export default InvoiceItemUpdateWithWhereUniqueWithoutInvoiceInputSchema;
