import type { Prisma } from '@/prisma/client';

import { z } from 'zod';
import { InvoiceItemWhereUniqueInputSchema } from './InvoiceItemWhereUniqueInputSchema';
import { InvoiceItemUpdateWithoutProductInputSchema } from './InvoiceItemUpdateWithoutProductInputSchema';
import { InvoiceItemUncheckedUpdateWithoutProductInputSchema } from './InvoiceItemUncheckedUpdateWithoutProductInputSchema';

export const InvoiceItemUpdateWithWhereUniqueWithoutProductInputSchema: z.ZodType<Prisma.InvoiceItemUpdateWithWhereUniqueWithoutProductInput> = z.strictObject({
  where: z.lazy(() => InvoiceItemWhereUniqueInputSchema),
  data: z.union([ z.lazy(() => InvoiceItemUpdateWithoutProductInputSchema), z.lazy(() => InvoiceItemUncheckedUpdateWithoutProductInputSchema) ]),
});

export default InvoiceItemUpdateWithWhereUniqueWithoutProductInputSchema;
