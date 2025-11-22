import type { Prisma } from '@/prisma/client';

import { z } from 'zod';
import { QuoteItemUpdateWithoutAttachmentsInputSchema } from './QuoteItemUpdateWithoutAttachmentsInputSchema';
import { QuoteItemUncheckedUpdateWithoutAttachmentsInputSchema } from './QuoteItemUncheckedUpdateWithoutAttachmentsInputSchema';
import { QuoteItemCreateWithoutAttachmentsInputSchema } from './QuoteItemCreateWithoutAttachmentsInputSchema';
import { QuoteItemUncheckedCreateWithoutAttachmentsInputSchema } from './QuoteItemUncheckedCreateWithoutAttachmentsInputSchema';
import { QuoteItemWhereInputSchema } from './QuoteItemWhereInputSchema';

export const QuoteItemUpsertWithoutAttachmentsInputSchema: z.ZodType<Prisma.QuoteItemUpsertWithoutAttachmentsInput> = z.strictObject({
  update: z.union([ z.lazy(() => QuoteItemUpdateWithoutAttachmentsInputSchema), z.lazy(() => QuoteItemUncheckedUpdateWithoutAttachmentsInputSchema) ]),
  create: z.union([ z.lazy(() => QuoteItemCreateWithoutAttachmentsInputSchema), z.lazy(() => QuoteItemUncheckedCreateWithoutAttachmentsInputSchema) ]),
  where: z.lazy(() => QuoteItemWhereInputSchema).optional(),
});

export default QuoteItemUpsertWithoutAttachmentsInputSchema;
