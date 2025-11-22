import type { Prisma } from '@/prisma/client';

import { z } from 'zod';
import { InvoiceScalarWhereInputSchema } from './InvoiceScalarWhereInputSchema';
import { InvoiceUpdateManyMutationInputSchema } from './InvoiceUpdateManyMutationInputSchema';
import { InvoiceUncheckedUpdateManyWithoutCustomerInputSchema } from './InvoiceUncheckedUpdateManyWithoutCustomerInputSchema';

export const InvoiceUpdateManyWithWhereWithoutCustomerInputSchema: z.ZodType<Prisma.InvoiceUpdateManyWithWhereWithoutCustomerInput> = z.strictObject({
  where: z.lazy(() => InvoiceScalarWhereInputSchema),
  data: z.union([ z.lazy(() => InvoiceUpdateManyMutationInputSchema), z.lazy(() => InvoiceUncheckedUpdateManyWithoutCustomerInputSchema) ]),
});

export default InvoiceUpdateManyWithWhereWithoutCustomerInputSchema;
