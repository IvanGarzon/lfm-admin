import type { Prisma } from '@/prisma/client';

import { z } from 'zod';
import { InvoiceItemWhereUniqueInputSchema } from './InvoiceItemWhereUniqueInputSchema';
import { InvoiceItemUpdateWithoutProductInputSchema } from './InvoiceItemUpdateWithoutProductInputSchema';
import { InvoiceItemUncheckedUpdateWithoutProductInputSchema } from './InvoiceItemUncheckedUpdateWithoutProductInputSchema';
import { InvoiceItemCreateWithoutProductInputSchema } from './InvoiceItemCreateWithoutProductInputSchema';
import { InvoiceItemUncheckedCreateWithoutProductInputSchema } from './InvoiceItemUncheckedCreateWithoutProductInputSchema';

export const InvoiceItemUpsertWithWhereUniqueWithoutProductInputSchema: z.ZodType<Prisma.InvoiceItemUpsertWithWhereUniqueWithoutProductInput> = z.strictObject({
  where: z.lazy(() => InvoiceItemWhereUniqueInputSchema),
  update: z.union([ z.lazy(() => InvoiceItemUpdateWithoutProductInputSchema), z.lazy(() => InvoiceItemUncheckedUpdateWithoutProductInputSchema) ]),
  create: z.union([ z.lazy(() => InvoiceItemCreateWithoutProductInputSchema), z.lazy(() => InvoiceItemUncheckedCreateWithoutProductInputSchema) ]),
});

export default InvoiceItemUpsertWithWhereUniqueWithoutProductInputSchema;
