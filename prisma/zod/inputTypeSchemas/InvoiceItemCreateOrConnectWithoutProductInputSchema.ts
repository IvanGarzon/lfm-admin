import type { Prisma } from '@/prisma/client';

import { z } from 'zod';
import { InvoiceItemWhereUniqueInputSchema } from './InvoiceItemWhereUniqueInputSchema';
import { InvoiceItemCreateWithoutProductInputSchema } from './InvoiceItemCreateWithoutProductInputSchema';
import { InvoiceItemUncheckedCreateWithoutProductInputSchema } from './InvoiceItemUncheckedCreateWithoutProductInputSchema';

export const InvoiceItemCreateOrConnectWithoutProductInputSchema: z.ZodType<Prisma.InvoiceItemCreateOrConnectWithoutProductInput> = z.strictObject({
  where: z.lazy(() => InvoiceItemWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => InvoiceItemCreateWithoutProductInputSchema), z.lazy(() => InvoiceItemUncheckedCreateWithoutProductInputSchema) ]),
});

export default InvoiceItemCreateOrConnectWithoutProductInputSchema;
