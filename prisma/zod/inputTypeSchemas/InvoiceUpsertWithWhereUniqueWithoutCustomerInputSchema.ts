import type { Prisma } from '@/prisma/client';

import { z } from 'zod';
import { InvoiceWhereUniqueInputSchema } from './InvoiceWhereUniqueInputSchema';
import { InvoiceUpdateWithoutCustomerInputSchema } from './InvoiceUpdateWithoutCustomerInputSchema';
import { InvoiceUncheckedUpdateWithoutCustomerInputSchema } from './InvoiceUncheckedUpdateWithoutCustomerInputSchema';
import { InvoiceCreateWithoutCustomerInputSchema } from './InvoiceCreateWithoutCustomerInputSchema';
import { InvoiceUncheckedCreateWithoutCustomerInputSchema } from './InvoiceUncheckedCreateWithoutCustomerInputSchema';

export const InvoiceUpsertWithWhereUniqueWithoutCustomerInputSchema: z.ZodType<Prisma.InvoiceUpsertWithWhereUniqueWithoutCustomerInput> = z.strictObject({
  where: z.lazy(() => InvoiceWhereUniqueInputSchema),
  update: z.union([ z.lazy(() => InvoiceUpdateWithoutCustomerInputSchema), z.lazy(() => InvoiceUncheckedUpdateWithoutCustomerInputSchema) ]),
  create: z.union([ z.lazy(() => InvoiceCreateWithoutCustomerInputSchema), z.lazy(() => InvoiceUncheckedCreateWithoutCustomerInputSchema) ]),
});

export default InvoiceUpsertWithWhereUniqueWithoutCustomerInputSchema;
