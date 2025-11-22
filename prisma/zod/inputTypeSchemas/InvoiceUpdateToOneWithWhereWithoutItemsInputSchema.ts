import type { Prisma } from '@/prisma/client';

import { z } from 'zod';
import { InvoiceWhereInputSchema } from './InvoiceWhereInputSchema';
import { InvoiceUpdateWithoutItemsInputSchema } from './InvoiceUpdateWithoutItemsInputSchema';
import { InvoiceUncheckedUpdateWithoutItemsInputSchema } from './InvoiceUncheckedUpdateWithoutItemsInputSchema';

export const InvoiceUpdateToOneWithWhereWithoutItemsInputSchema: z.ZodType<Prisma.InvoiceUpdateToOneWithWhereWithoutItemsInput> = z.strictObject({
  where: z.lazy(() => InvoiceWhereInputSchema).optional(),
  data: z.union([ z.lazy(() => InvoiceUpdateWithoutItemsInputSchema), z.lazy(() => InvoiceUncheckedUpdateWithoutItemsInputSchema) ]),
});

export default InvoiceUpdateToOneWithWhereWithoutItemsInputSchema;
