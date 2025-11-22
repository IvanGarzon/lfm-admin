import type { Prisma } from '@/prisma/client';

import { z } from 'zod';
import { InvoiceCreateWithoutItemsInputSchema } from './InvoiceCreateWithoutItemsInputSchema';
import { InvoiceUncheckedCreateWithoutItemsInputSchema } from './InvoiceUncheckedCreateWithoutItemsInputSchema';
import { InvoiceCreateOrConnectWithoutItemsInputSchema } from './InvoiceCreateOrConnectWithoutItemsInputSchema';
import { InvoiceUpsertWithoutItemsInputSchema } from './InvoiceUpsertWithoutItemsInputSchema';
import { InvoiceWhereUniqueInputSchema } from './InvoiceWhereUniqueInputSchema';
import { InvoiceUpdateToOneWithWhereWithoutItemsInputSchema } from './InvoiceUpdateToOneWithWhereWithoutItemsInputSchema';
import { InvoiceUpdateWithoutItemsInputSchema } from './InvoiceUpdateWithoutItemsInputSchema';
import { InvoiceUncheckedUpdateWithoutItemsInputSchema } from './InvoiceUncheckedUpdateWithoutItemsInputSchema';

export const InvoiceUpdateOneRequiredWithoutItemsNestedInputSchema: z.ZodType<Prisma.InvoiceUpdateOneRequiredWithoutItemsNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => InvoiceCreateWithoutItemsInputSchema), z.lazy(() => InvoiceUncheckedCreateWithoutItemsInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => InvoiceCreateOrConnectWithoutItemsInputSchema).optional(),
  upsert: z.lazy(() => InvoiceUpsertWithoutItemsInputSchema).optional(),
  connect: z.lazy(() => InvoiceWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => InvoiceUpdateToOneWithWhereWithoutItemsInputSchema), z.lazy(() => InvoiceUpdateWithoutItemsInputSchema), z.lazy(() => InvoiceUncheckedUpdateWithoutItemsInputSchema) ]).optional(),
});

export default InvoiceUpdateOneRequiredWithoutItemsNestedInputSchema;
