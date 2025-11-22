import type { Prisma } from '@/prisma/client';

import { z } from 'zod';
import { QuoteItemCreateManyProductInputSchema } from './QuoteItemCreateManyProductInputSchema';

export const QuoteItemCreateManyProductInputEnvelopeSchema: z.ZodType<Prisma.QuoteItemCreateManyProductInputEnvelope> = z.strictObject({
  data: z.union([ z.lazy(() => QuoteItemCreateManyProductInputSchema), z.lazy(() => QuoteItemCreateManyProductInputSchema).array() ]),
  skipDuplicates: z.boolean().optional(),
});

export default QuoteItemCreateManyProductInputEnvelopeSchema;
