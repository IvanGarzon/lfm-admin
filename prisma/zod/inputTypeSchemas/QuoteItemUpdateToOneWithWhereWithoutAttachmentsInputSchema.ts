import type { Prisma } from '@/prisma/client';

import { z } from 'zod';
import { QuoteItemWhereInputSchema } from './QuoteItemWhereInputSchema';
import { QuoteItemUpdateWithoutAttachmentsInputSchema } from './QuoteItemUpdateWithoutAttachmentsInputSchema';
import { QuoteItemUncheckedUpdateWithoutAttachmentsInputSchema } from './QuoteItemUncheckedUpdateWithoutAttachmentsInputSchema';

export const QuoteItemUpdateToOneWithWhereWithoutAttachmentsInputSchema: z.ZodType<Prisma.QuoteItemUpdateToOneWithWhereWithoutAttachmentsInput> = z.strictObject({
  where: z.lazy(() => QuoteItemWhereInputSchema).optional(),
  data: z.union([ z.lazy(() => QuoteItemUpdateWithoutAttachmentsInputSchema), z.lazy(() => QuoteItemUncheckedUpdateWithoutAttachmentsInputSchema) ]),
});

export default QuoteItemUpdateToOneWithWhereWithoutAttachmentsInputSchema;
