import type { Prisma } from '@/prisma/client';

import { z } from 'zod';
import { InvoiceCreateWithoutCustomerInputSchema } from './InvoiceCreateWithoutCustomerInputSchema';
import { InvoiceUncheckedCreateWithoutCustomerInputSchema } from './InvoiceUncheckedCreateWithoutCustomerInputSchema';
import { InvoiceCreateOrConnectWithoutCustomerInputSchema } from './InvoiceCreateOrConnectWithoutCustomerInputSchema';
import { InvoiceCreateManyCustomerInputEnvelopeSchema } from './InvoiceCreateManyCustomerInputEnvelopeSchema';
import { InvoiceWhereUniqueInputSchema } from './InvoiceWhereUniqueInputSchema';

export const InvoiceUncheckedCreateNestedManyWithoutCustomerInputSchema: z.ZodType<Prisma.InvoiceUncheckedCreateNestedManyWithoutCustomerInput> = z.strictObject({
  create: z.union([ z.lazy(() => InvoiceCreateWithoutCustomerInputSchema), z.lazy(() => InvoiceCreateWithoutCustomerInputSchema).array(), z.lazy(() => InvoiceUncheckedCreateWithoutCustomerInputSchema), z.lazy(() => InvoiceUncheckedCreateWithoutCustomerInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => InvoiceCreateOrConnectWithoutCustomerInputSchema), z.lazy(() => InvoiceCreateOrConnectWithoutCustomerInputSchema).array() ]).optional(),
  createMany: z.lazy(() => InvoiceCreateManyCustomerInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => InvoiceWhereUniqueInputSchema), z.lazy(() => InvoiceWhereUniqueInputSchema).array() ]).optional(),
});

export default InvoiceUncheckedCreateNestedManyWithoutCustomerInputSchema;
