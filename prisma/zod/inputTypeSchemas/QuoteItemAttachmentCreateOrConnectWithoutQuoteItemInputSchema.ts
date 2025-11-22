import type { Prisma } from '@/prisma/client';

import { z } from 'zod';
import { QuoteItemAttachmentWhereUniqueInputSchema } from './QuoteItemAttachmentWhereUniqueInputSchema';
import { QuoteItemAttachmentCreateWithoutQuoteItemInputSchema } from './QuoteItemAttachmentCreateWithoutQuoteItemInputSchema';
import { QuoteItemAttachmentUncheckedCreateWithoutQuoteItemInputSchema } from './QuoteItemAttachmentUncheckedCreateWithoutQuoteItemInputSchema';

export const QuoteItemAttachmentCreateOrConnectWithoutQuoteItemInputSchema: z.ZodType<Prisma.QuoteItemAttachmentCreateOrConnectWithoutQuoteItemInput> = z.strictObject({
  where: z.lazy(() => QuoteItemAttachmentWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => QuoteItemAttachmentCreateWithoutQuoteItemInputSchema), z.lazy(() => QuoteItemAttachmentUncheckedCreateWithoutQuoteItemInputSchema) ]),
});

export default QuoteItemAttachmentCreateOrConnectWithoutQuoteItemInputSchema;
