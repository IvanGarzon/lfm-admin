import type { Prisma } from '@/prisma/client';

import { z } from 'zod';
import { InvoiceWhereUniqueInputSchema } from './InvoiceWhereUniqueInputSchema';
import { InvoiceCreateWithoutItemsInputSchema } from './InvoiceCreateWithoutItemsInputSchema';
import { InvoiceUncheckedCreateWithoutItemsInputSchema } from './InvoiceUncheckedCreateWithoutItemsInputSchema';

export const InvoiceCreateOrConnectWithoutItemsInputSchema: z.ZodType<Prisma.InvoiceCreateOrConnectWithoutItemsInput> = z.strictObject({
  where: z.lazy(() => InvoiceWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => InvoiceCreateWithoutItemsInputSchema), z.lazy(() => InvoiceUncheckedCreateWithoutItemsInputSchema) ]),
});

export default InvoiceCreateOrConnectWithoutItemsInputSchema;
