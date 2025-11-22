import type { Prisma } from '@/prisma/client';

import { z } from 'zod';
import { QuoteItemAttachmentWhereUniqueInputSchema } from './QuoteItemAttachmentWhereUniqueInputSchema';
import { QuoteItemAttachmentUpdateWithoutQuoteItemInputSchema } from './QuoteItemAttachmentUpdateWithoutQuoteItemInputSchema';
import { QuoteItemAttachmentUncheckedUpdateWithoutQuoteItemInputSchema } from './QuoteItemAttachmentUncheckedUpdateWithoutQuoteItemInputSchema';

export const QuoteItemAttachmentUpdateWithWhereUniqueWithoutQuoteItemInputSchema: z.ZodType<Prisma.QuoteItemAttachmentUpdateWithWhereUniqueWithoutQuoteItemInput> = z.strictObject({
  where: z.lazy(() => QuoteItemAttachmentWhereUniqueInputSchema),
  data: z.union([ z.lazy(() => QuoteItemAttachmentUpdateWithoutQuoteItemInputSchema), z.lazy(() => QuoteItemAttachmentUncheckedUpdateWithoutQuoteItemInputSchema) ]),
});

export default QuoteItemAttachmentUpdateWithWhereUniqueWithoutQuoteItemInputSchema;
