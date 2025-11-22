import type { Prisma } from '@/prisma/client';

import { z } from 'zod';
import { QuoteItemAttachmentScalarWhereInputSchema } from './QuoteItemAttachmentScalarWhereInputSchema';
import { QuoteItemAttachmentUpdateManyMutationInputSchema } from './QuoteItemAttachmentUpdateManyMutationInputSchema';
import { QuoteItemAttachmentUncheckedUpdateManyWithoutQuoteItemInputSchema } from './QuoteItemAttachmentUncheckedUpdateManyWithoutQuoteItemInputSchema';

export const QuoteItemAttachmentUpdateManyWithWhereWithoutQuoteItemInputSchema: z.ZodType<Prisma.QuoteItemAttachmentUpdateManyWithWhereWithoutQuoteItemInput> = z.strictObject({
  where: z.lazy(() => QuoteItemAttachmentScalarWhereInputSchema),
  data: z.union([ z.lazy(() => QuoteItemAttachmentUpdateManyMutationInputSchema), z.lazy(() => QuoteItemAttachmentUncheckedUpdateManyWithoutQuoteItemInputSchema) ]),
});

export default QuoteItemAttachmentUpdateManyWithWhereWithoutQuoteItemInputSchema;
