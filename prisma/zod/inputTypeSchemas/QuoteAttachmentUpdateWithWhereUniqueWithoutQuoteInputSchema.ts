import type { Prisma } from '@/prisma/client';

import { z } from 'zod';
import { QuoteAttachmentWhereUniqueInputSchema } from './QuoteAttachmentWhereUniqueInputSchema';
import { QuoteAttachmentUpdateWithoutQuoteInputSchema } from './QuoteAttachmentUpdateWithoutQuoteInputSchema';
import { QuoteAttachmentUncheckedUpdateWithoutQuoteInputSchema } from './QuoteAttachmentUncheckedUpdateWithoutQuoteInputSchema';

export const QuoteAttachmentUpdateWithWhereUniqueWithoutQuoteInputSchema: z.ZodType<Prisma.QuoteAttachmentUpdateWithWhereUniqueWithoutQuoteInput> = z.strictObject({
  where: z.lazy(() => QuoteAttachmentWhereUniqueInputSchema),
  data: z.union([ z.lazy(() => QuoteAttachmentUpdateWithoutQuoteInputSchema), z.lazy(() => QuoteAttachmentUncheckedUpdateWithoutQuoteInputSchema) ]),
});

export default QuoteAttachmentUpdateWithWhereUniqueWithoutQuoteInputSchema;
