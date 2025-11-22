import type { Prisma } from '@/prisma/client';

import { z } from 'zod';
import { QuoteAttachmentWhereUniqueInputSchema } from './QuoteAttachmentWhereUniqueInputSchema';
import { QuoteAttachmentCreateWithoutQuoteInputSchema } from './QuoteAttachmentCreateWithoutQuoteInputSchema';
import { QuoteAttachmentUncheckedCreateWithoutQuoteInputSchema } from './QuoteAttachmentUncheckedCreateWithoutQuoteInputSchema';

export const QuoteAttachmentCreateOrConnectWithoutQuoteInputSchema: z.ZodType<Prisma.QuoteAttachmentCreateOrConnectWithoutQuoteInput> = z.strictObject({
  where: z.lazy(() => QuoteAttachmentWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => QuoteAttachmentCreateWithoutQuoteInputSchema), z.lazy(() => QuoteAttachmentUncheckedCreateWithoutQuoteInputSchema) ]),
});

export default QuoteAttachmentCreateOrConnectWithoutQuoteInputSchema;
