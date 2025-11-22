import type { Prisma } from '@/prisma/client';

import { z } from 'zod';
import { QuoteWhereInputSchema } from './QuoteWhereInputSchema';
import { QuoteUpdateWithoutAttachmentsInputSchema } from './QuoteUpdateWithoutAttachmentsInputSchema';
import { QuoteUncheckedUpdateWithoutAttachmentsInputSchema } from './QuoteUncheckedUpdateWithoutAttachmentsInputSchema';

export const QuoteUpdateToOneWithWhereWithoutAttachmentsInputSchema: z.ZodType<Prisma.QuoteUpdateToOneWithWhereWithoutAttachmentsInput> = z.strictObject({
  where: z.lazy(() => QuoteWhereInputSchema).optional(),
  data: z.union([ z.lazy(() => QuoteUpdateWithoutAttachmentsInputSchema), z.lazy(() => QuoteUncheckedUpdateWithoutAttachmentsInputSchema) ]),
});

export default QuoteUpdateToOneWithWhereWithoutAttachmentsInputSchema;
