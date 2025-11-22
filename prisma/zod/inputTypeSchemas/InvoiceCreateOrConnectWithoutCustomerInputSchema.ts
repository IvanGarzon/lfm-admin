import type { Prisma } from '@/prisma/client';

import { z } from 'zod';
import { InvoiceWhereUniqueInputSchema } from './InvoiceWhereUniqueInputSchema';
import { InvoiceCreateWithoutCustomerInputSchema } from './InvoiceCreateWithoutCustomerInputSchema';
import { InvoiceUncheckedCreateWithoutCustomerInputSchema } from './InvoiceUncheckedCreateWithoutCustomerInputSchema';

export const InvoiceCreateOrConnectWithoutCustomerInputSchema: z.ZodType<Prisma.InvoiceCreateOrConnectWithoutCustomerInput> = z.strictObject({
  where: z.lazy(() => InvoiceWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => InvoiceCreateWithoutCustomerInputSchema), z.lazy(() => InvoiceUncheckedCreateWithoutCustomerInputSchema) ]),
});

export default InvoiceCreateOrConnectWithoutCustomerInputSchema;
