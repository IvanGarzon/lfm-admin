import type { Prisma } from '@/prisma/client';

import { z } from 'zod';
import { InvoiceUpdateWithoutItemsInputSchema } from './InvoiceUpdateWithoutItemsInputSchema';
import { InvoiceUncheckedUpdateWithoutItemsInputSchema } from './InvoiceUncheckedUpdateWithoutItemsInputSchema';
import { InvoiceCreateWithoutItemsInputSchema } from './InvoiceCreateWithoutItemsInputSchema';
import { InvoiceUncheckedCreateWithoutItemsInputSchema } from './InvoiceUncheckedCreateWithoutItemsInputSchema';
import { InvoiceWhereInputSchema } from './InvoiceWhereInputSchema';

export const InvoiceUpsertWithoutItemsInputSchema: z.ZodType<Prisma.InvoiceUpsertWithoutItemsInput> = z.strictObject({
  update: z.union([ z.lazy(() => InvoiceUpdateWithoutItemsInputSchema), z.lazy(() => InvoiceUncheckedUpdateWithoutItemsInputSchema) ]),
  create: z.union([ z.lazy(() => InvoiceCreateWithoutItemsInputSchema), z.lazy(() => InvoiceUncheckedCreateWithoutItemsInputSchema) ]),
  where: z.lazy(() => InvoiceWhereInputSchema).optional(),
});

export default InvoiceUpsertWithoutItemsInputSchema;
