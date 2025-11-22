import type { Prisma } from '@/prisma/client';

import { z } from 'zod';
import { QuoteItemAttachmentCreateManyQuoteItemInputSchema } from './QuoteItemAttachmentCreateManyQuoteItemInputSchema';

export const QuoteItemAttachmentCreateManyQuoteItemInputEnvelopeSchema: z.ZodType<Prisma.QuoteItemAttachmentCreateManyQuoteItemInputEnvelope> = z.strictObject({
  data: z.union([ z.lazy(() => QuoteItemAttachmentCreateManyQuoteItemInputSchema), z.lazy(() => QuoteItemAttachmentCreateManyQuoteItemInputSchema).array() ]),
  skipDuplicates: z.boolean().optional(),
});

export default QuoteItemAttachmentCreateManyQuoteItemInputEnvelopeSchema;
