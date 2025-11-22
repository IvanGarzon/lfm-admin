import type { Prisma } from '@/prisma/client';

import { z } from 'zod';
import { InvoiceCreateWithoutCustomerInputSchema } from './InvoiceCreateWithoutCustomerInputSchema';
import { InvoiceUncheckedCreateWithoutCustomerInputSchema } from './InvoiceUncheckedCreateWithoutCustomerInputSchema';
import { InvoiceCreateOrConnectWithoutCustomerInputSchema } from './InvoiceCreateOrConnectWithoutCustomerInputSchema';
import { InvoiceUpsertWithWhereUniqueWithoutCustomerInputSchema } from './InvoiceUpsertWithWhereUniqueWithoutCustomerInputSchema';
import { InvoiceCreateManyCustomerInputEnvelopeSchema } from './InvoiceCreateManyCustomerInputEnvelopeSchema';
import { InvoiceWhereUniqueInputSchema } from './InvoiceWhereUniqueInputSchema';
import { InvoiceUpdateWithWhereUniqueWithoutCustomerInputSchema } from './InvoiceUpdateWithWhereUniqueWithoutCustomerInputSchema';
import { InvoiceUpdateManyWithWhereWithoutCustomerInputSchema } from './InvoiceUpdateManyWithWhereWithoutCustomerInputSchema';
import { InvoiceScalarWhereInputSchema } from './InvoiceScalarWhereInputSchema';

export const InvoiceUpdateManyWithoutCustomerNestedInputSchema: z.ZodType<Prisma.InvoiceUpdateManyWithoutCustomerNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => InvoiceCreateWithoutCustomerInputSchema), z.lazy(() => InvoiceCreateWithoutCustomerInputSchema).array(), z.lazy(() => InvoiceUncheckedCreateWithoutCustomerInputSchema), z.lazy(() => InvoiceUncheckedCreateWithoutCustomerInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => InvoiceCreateOrConnectWithoutCustomerInputSchema), z.lazy(() => InvoiceCreateOrConnectWithoutCustomerInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => InvoiceUpsertWithWhereUniqueWithoutCustomerInputSchema), z.lazy(() => InvoiceUpsertWithWhereUniqueWithoutCustomerInputSchema).array() ]).optional(),
  createMany: z.lazy(() => InvoiceCreateManyCustomerInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => InvoiceWhereUniqueInputSchema), z.lazy(() => InvoiceWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => InvoiceWhereUniqueInputSchema), z.lazy(() => InvoiceWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => InvoiceWhereUniqueInputSchema), z.lazy(() => InvoiceWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => InvoiceWhereUniqueInputSchema), z.lazy(() => InvoiceWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => InvoiceUpdateWithWhereUniqueWithoutCustomerInputSchema), z.lazy(() => InvoiceUpdateWithWhereUniqueWithoutCustomerInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => InvoiceUpdateManyWithWhereWithoutCustomerInputSchema), z.lazy(() => InvoiceUpdateManyWithWhereWithoutCustomerInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => InvoiceScalarWhereInputSchema), z.lazy(() => InvoiceScalarWhereInputSchema).array() ]).optional(),
});

export default InvoiceUpdateManyWithoutCustomerNestedInputSchema;
