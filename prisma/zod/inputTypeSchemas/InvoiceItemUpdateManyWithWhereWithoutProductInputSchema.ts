import type { Prisma } from '@/prisma/client';

import { z } from 'zod';
import { InvoiceItemScalarWhereInputSchema } from './InvoiceItemScalarWhereInputSchema';
import { InvoiceItemUpdateManyMutationInputSchema } from './InvoiceItemUpdateManyMutationInputSchema';
import { InvoiceItemUncheckedUpdateManyWithoutProductInputSchema } from './InvoiceItemUncheckedUpdateManyWithoutProductInputSchema';

export const InvoiceItemUpdateManyWithWhereWithoutProductInputSchema: z.ZodType<Prisma.InvoiceItemUpdateManyWithWhereWithoutProductInput> = z.strictObject({
  where: z.lazy(() => InvoiceItemScalarWhereInputSchema),
  data: z.union([ z.lazy(() => InvoiceItemUpdateManyMutationInputSchema), z.lazy(() => InvoiceItemUncheckedUpdateManyWithoutProductInputSchema) ]),
});

export default InvoiceItemUpdateManyWithWhereWithoutProductInputSchema;
