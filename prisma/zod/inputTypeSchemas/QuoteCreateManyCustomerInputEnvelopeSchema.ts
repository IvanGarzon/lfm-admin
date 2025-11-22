import type { Prisma } from '@/prisma/client';

import { z } from 'zod';
import { QuoteCreateManyCustomerInputSchema } from './QuoteCreateManyCustomerInputSchema';

export const QuoteCreateManyCustomerInputEnvelopeSchema: z.ZodType<Prisma.QuoteCreateManyCustomerInputEnvelope> = z.strictObject({
  data: z.union([ z.lazy(() => QuoteCreateManyCustomerInputSchema), z.lazy(() => QuoteCreateManyCustomerInputSchema).array() ]),
  skipDuplicates: z.boolean().optional(),
});

export default QuoteCreateManyCustomerInputEnvelopeSchema;
