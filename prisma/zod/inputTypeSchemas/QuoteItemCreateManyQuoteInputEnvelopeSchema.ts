import type { Prisma } from '@/prisma/client';

import { z } from 'zod';
import { QuoteItemCreateManyQuoteInputSchema } from './QuoteItemCreateManyQuoteInputSchema';

export const QuoteItemCreateManyQuoteInputEnvelopeSchema: z.ZodType<Prisma.QuoteItemCreateManyQuoteInputEnvelope> = z.strictObject({
  data: z.union([ z.lazy(() => QuoteItemCreateManyQuoteInputSchema), z.lazy(() => QuoteItemCreateManyQuoteInputSchema).array() ]),
  skipDuplicates: z.boolean().optional(),
});

export default QuoteItemCreateManyQuoteInputEnvelopeSchema;
