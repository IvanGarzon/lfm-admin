import type { Prisma } from '@/prisma/client';

import { z } from 'zod';
import { QuoteCreateWithoutCustomerInputSchema } from './QuoteCreateWithoutCustomerInputSchema';
import { QuoteUncheckedCreateWithoutCustomerInputSchema } from './QuoteUncheckedCreateWithoutCustomerInputSchema';
import { QuoteCreateOrConnectWithoutCustomerInputSchema } from './QuoteCreateOrConnectWithoutCustomerInputSchema';
import { QuoteCreateManyCustomerInputEnvelopeSchema } from './QuoteCreateManyCustomerInputEnvelopeSchema';
import { QuoteWhereUniqueInputSchema } from './QuoteWhereUniqueInputSchema';

export const QuoteCreateNestedManyWithoutCustomerInputSchema: z.ZodType<Prisma.QuoteCreateNestedManyWithoutCustomerInput> = z.strictObject({
  create: z.union([ z.lazy(() => QuoteCreateWithoutCustomerInputSchema), z.lazy(() => QuoteCreateWithoutCustomerInputSchema).array(), z.lazy(() => QuoteUncheckedCreateWithoutCustomerInputSchema), z.lazy(() => QuoteUncheckedCreateWithoutCustomerInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => QuoteCreateOrConnectWithoutCustomerInputSchema), z.lazy(() => QuoteCreateOrConnectWithoutCustomerInputSchema).array() ]).optional(),
  createMany: z.lazy(() => QuoteCreateManyCustomerInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => QuoteWhereUniqueInputSchema), z.lazy(() => QuoteWhereUniqueInputSchema).array() ]).optional(),
});

export default QuoteCreateNestedManyWithoutCustomerInputSchema;
