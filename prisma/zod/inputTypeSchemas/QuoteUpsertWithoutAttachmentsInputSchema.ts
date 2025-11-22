import type { Prisma } from '@/prisma/client';

import { z } from 'zod';
import { QuoteUpdateWithoutAttachmentsInputSchema } from './QuoteUpdateWithoutAttachmentsInputSchema';
import { QuoteUncheckedUpdateWithoutAttachmentsInputSchema } from './QuoteUncheckedUpdateWithoutAttachmentsInputSchema';
import { QuoteCreateWithoutAttachmentsInputSchema } from './QuoteCreateWithoutAttachmentsInputSchema';
import { QuoteUncheckedCreateWithoutAttachmentsInputSchema } from './QuoteUncheckedCreateWithoutAttachmentsInputSchema';
import { QuoteWhereInputSchema } from './QuoteWhereInputSchema';

export const QuoteUpsertWithoutAttachmentsInputSchema: z.ZodType<Prisma.QuoteUpsertWithoutAttachmentsInput> = z.strictObject({
  update: z.union([ z.lazy(() => QuoteUpdateWithoutAttachmentsInputSchema), z.lazy(() => QuoteUncheckedUpdateWithoutAttachmentsInputSchema) ]),
  create: z.union([ z.lazy(() => QuoteCreateWithoutAttachmentsInputSchema), z.lazy(() => QuoteUncheckedCreateWithoutAttachmentsInputSchema) ]),
  where: z.lazy(() => QuoteWhereInputSchema).optional(),
});

export default QuoteUpsertWithoutAttachmentsInputSchema;
