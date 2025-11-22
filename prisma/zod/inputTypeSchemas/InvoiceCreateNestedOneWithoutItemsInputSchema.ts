import type { Prisma } from '@/prisma/client';

import { z } from 'zod';
import { InvoiceCreateWithoutItemsInputSchema } from './InvoiceCreateWithoutItemsInputSchema';
import { InvoiceUncheckedCreateWithoutItemsInputSchema } from './InvoiceUncheckedCreateWithoutItemsInputSchema';
import { InvoiceCreateOrConnectWithoutItemsInputSchema } from './InvoiceCreateOrConnectWithoutItemsInputSchema';
import { InvoiceWhereUniqueInputSchema } from './InvoiceWhereUniqueInputSchema';

export const InvoiceCreateNestedOneWithoutItemsInputSchema: z.ZodType<Prisma.InvoiceCreateNestedOneWithoutItemsInput> = z.strictObject({
  create: z.union([ z.lazy(() => InvoiceCreateWithoutItemsInputSchema), z.lazy(() => InvoiceUncheckedCreateWithoutItemsInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => InvoiceCreateOrConnectWithoutItemsInputSchema).optional(),
  connect: z.lazy(() => InvoiceWhereUniqueInputSchema).optional(),
});

export default InvoiceCreateNestedOneWithoutItemsInputSchema;
