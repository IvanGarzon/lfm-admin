import type { Prisma } from '@/prisma/client';

import { z } from 'zod';
import { InvoiceItemScalarWhereInputSchema } from './InvoiceItemScalarWhereInputSchema';
import { InvoiceItemUpdateManyMutationInputSchema } from './InvoiceItemUpdateManyMutationInputSchema';
import { InvoiceItemUncheckedUpdateManyWithoutInvoiceInputSchema } from './InvoiceItemUncheckedUpdateManyWithoutInvoiceInputSchema';

export const InvoiceItemUpdateManyWithWhereWithoutInvoiceInputSchema: z.ZodType<Prisma.InvoiceItemUpdateManyWithWhereWithoutInvoiceInput> = z.strictObject({
  where: z.lazy(() => InvoiceItemScalarWhereInputSchema),
  data: z.union([ z.lazy(() => InvoiceItemUpdateManyMutationInputSchema), z.lazy(() => InvoiceItemUncheckedUpdateManyWithoutInvoiceInputSchema) ]),
});

export default InvoiceItemUpdateManyWithWhereWithoutInvoiceInputSchema;
