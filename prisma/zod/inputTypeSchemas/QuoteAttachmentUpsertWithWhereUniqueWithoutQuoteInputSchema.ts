import type { Prisma } from '@/prisma/client';

import { z } from 'zod';
import { QuoteAttachmentWhereUniqueInputSchema } from './QuoteAttachmentWhereUniqueInputSchema';
import { QuoteAttachmentUpdateWithoutQuoteInputSchema } from './QuoteAttachmentUpdateWithoutQuoteInputSchema';
import { QuoteAttachmentUncheckedUpdateWithoutQuoteInputSchema } from './QuoteAttachmentUncheckedUpdateWithoutQuoteInputSchema';
import { QuoteAttachmentCreateWithoutQuoteInputSchema } from './QuoteAttachmentCreateWithoutQuoteInputSchema';
import { QuoteAttachmentUncheckedCreateWithoutQuoteInputSchema } from './QuoteAttachmentUncheckedCreateWithoutQuoteInputSchema';

export const QuoteAttachmentUpsertWithWhereUniqueWithoutQuoteInputSchema: z.ZodType<Prisma.QuoteAttachmentUpsertWithWhereUniqueWithoutQuoteInput> = z.strictObject({
  where: z.lazy(() => QuoteAttachmentWhereUniqueInputSchema),
  update: z.union([ z.lazy(() => QuoteAttachmentUpdateWithoutQuoteInputSchema), z.lazy(() => QuoteAttachmentUncheckedUpdateWithoutQuoteInputSchema) ]),
  create: z.union([ z.lazy(() => QuoteAttachmentCreateWithoutQuoteInputSchema), z.lazy(() => QuoteAttachmentUncheckedCreateWithoutQuoteInputSchema) ]),
});

export default QuoteAttachmentUpsertWithWhereUniqueWithoutQuoteInputSchema;
