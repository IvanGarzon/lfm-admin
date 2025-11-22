import type { Prisma } from '@/prisma/client';

import { z } from 'zod';
import { QuoteAttachmentScalarWhereInputSchema } from './QuoteAttachmentScalarWhereInputSchema';
import { QuoteAttachmentUpdateManyMutationInputSchema } from './QuoteAttachmentUpdateManyMutationInputSchema';
import { QuoteAttachmentUncheckedUpdateManyWithoutQuoteInputSchema } from './QuoteAttachmentUncheckedUpdateManyWithoutQuoteInputSchema';

export const QuoteAttachmentUpdateManyWithWhereWithoutQuoteInputSchema: z.ZodType<Prisma.QuoteAttachmentUpdateManyWithWhereWithoutQuoteInput> = z.strictObject({
  where: z.lazy(() => QuoteAttachmentScalarWhereInputSchema),
  data: z.union([ z.lazy(() => QuoteAttachmentUpdateManyMutationInputSchema), z.lazy(() => QuoteAttachmentUncheckedUpdateManyWithoutQuoteInputSchema) ]),
});

export default QuoteAttachmentUpdateManyWithWhereWithoutQuoteInputSchema;
