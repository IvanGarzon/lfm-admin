import type { Prisma } from '@/prisma/client';

import { z } from 'zod';
import { QuoteCreateWithoutCustomerInputSchema } from './QuoteCreateWithoutCustomerInputSchema';
import { QuoteUncheckedCreateWithoutCustomerInputSchema } from './QuoteUncheckedCreateWithoutCustomerInputSchema';
import { QuoteCreateOrConnectWithoutCustomerInputSchema } from './QuoteCreateOrConnectWithoutCustomerInputSchema';
import { QuoteUpsertWithWhereUniqueWithoutCustomerInputSchema } from './QuoteUpsertWithWhereUniqueWithoutCustomerInputSchema';
import { QuoteCreateManyCustomerInputEnvelopeSchema } from './QuoteCreateManyCustomerInputEnvelopeSchema';
import { QuoteWhereUniqueInputSchema } from './QuoteWhereUniqueInputSchema';
import { QuoteUpdateWithWhereUniqueWithoutCustomerInputSchema } from './QuoteUpdateWithWhereUniqueWithoutCustomerInputSchema';
import { QuoteUpdateManyWithWhereWithoutCustomerInputSchema } from './QuoteUpdateManyWithWhereWithoutCustomerInputSchema';
import { QuoteScalarWhereInputSchema } from './QuoteScalarWhereInputSchema';

export const QuoteUpdateManyWithoutCustomerNestedInputSchema: z.ZodType<Prisma.QuoteUpdateManyWithoutCustomerNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => QuoteCreateWithoutCustomerInputSchema), z.lazy(() => QuoteCreateWithoutCustomerInputSchema).array(), z.lazy(() => QuoteUncheckedCreateWithoutCustomerInputSchema), z.lazy(() => QuoteUncheckedCreateWithoutCustomerInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => QuoteCreateOrConnectWithoutCustomerInputSchema), z.lazy(() => QuoteCreateOrConnectWithoutCustomerInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => QuoteUpsertWithWhereUniqueWithoutCustomerInputSchema), z.lazy(() => QuoteUpsertWithWhereUniqueWithoutCustomerInputSchema).array() ]).optional(),
  createMany: z.lazy(() => QuoteCreateManyCustomerInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => QuoteWhereUniqueInputSchema), z.lazy(() => QuoteWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => QuoteWhereUniqueInputSchema), z.lazy(() => QuoteWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => QuoteWhereUniqueInputSchema), z.lazy(() => QuoteWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => QuoteWhereUniqueInputSchema), z.lazy(() => QuoteWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => QuoteUpdateWithWhereUniqueWithoutCustomerInputSchema), z.lazy(() => QuoteUpdateWithWhereUniqueWithoutCustomerInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => QuoteUpdateManyWithWhereWithoutCustomerInputSchema), z.lazy(() => QuoteUpdateManyWithWhereWithoutCustomerInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => QuoteScalarWhereInputSchema), z.lazy(() => QuoteScalarWhereInputSchema).array() ]).optional(),
});

export default QuoteUpdateManyWithoutCustomerNestedInputSchema;
