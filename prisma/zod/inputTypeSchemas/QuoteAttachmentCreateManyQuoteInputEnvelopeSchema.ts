import type { Prisma } from '@/prisma/client';

import { z } from 'zod';
import { QuoteAttachmentCreateManyQuoteInputSchema } from './QuoteAttachmentCreateManyQuoteInputSchema';

export const QuoteAttachmentCreateManyQuoteInputEnvelopeSchema: z.ZodType<Prisma.QuoteAttachmentCreateManyQuoteInputEnvelope> = z.strictObject({
  data: z.union([ z.lazy(() => QuoteAttachmentCreateManyQuoteInputSchema), z.lazy(() => QuoteAttachmentCreateManyQuoteInputSchema).array() ]),
  skipDuplicates: z.boolean().optional(),
});

export default QuoteAttachmentCreateManyQuoteInputEnvelopeSchema;
