import type { Prisma } from '@/prisma/client';

import { z } from 'zod';
import { QuoteItemAttachmentWhereUniqueInputSchema } from './QuoteItemAttachmentWhereUniqueInputSchema';
import { QuoteItemAttachmentUpdateWithoutQuoteItemInputSchema } from './QuoteItemAttachmentUpdateWithoutQuoteItemInputSchema';
import { QuoteItemAttachmentUncheckedUpdateWithoutQuoteItemInputSchema } from './QuoteItemAttachmentUncheckedUpdateWithoutQuoteItemInputSchema';
import { QuoteItemAttachmentCreateWithoutQuoteItemInputSchema } from './QuoteItemAttachmentCreateWithoutQuoteItemInputSchema';
import { QuoteItemAttachmentUncheckedCreateWithoutQuoteItemInputSchema } from './QuoteItemAttachmentUncheckedCreateWithoutQuoteItemInputSchema';

export const QuoteItemAttachmentUpsertWithWhereUniqueWithoutQuoteItemInputSchema: z.ZodType<Prisma.QuoteItemAttachmentUpsertWithWhereUniqueWithoutQuoteItemInput> = z.strictObject({
  where: z.lazy(() => QuoteItemAttachmentWhereUniqueInputSchema),
  update: z.union([ z.lazy(() => QuoteItemAttachmentUpdateWithoutQuoteItemInputSchema), z.lazy(() => QuoteItemAttachmentUncheckedUpdateWithoutQuoteItemInputSchema) ]),
  create: z.union([ z.lazy(() => QuoteItemAttachmentCreateWithoutQuoteItemInputSchema), z.lazy(() => QuoteItemAttachmentUncheckedCreateWithoutQuoteItemInputSchema) ]),
});

export default QuoteItemAttachmentUpsertWithWhereUniqueWithoutQuoteItemInputSchema;
