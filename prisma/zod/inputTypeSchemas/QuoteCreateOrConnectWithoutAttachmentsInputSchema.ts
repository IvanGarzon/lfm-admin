import type { Prisma } from '@/prisma/client';

import { z } from 'zod';
import { QuoteWhereUniqueInputSchema } from './QuoteWhereUniqueInputSchema';
import { QuoteCreateWithoutAttachmentsInputSchema } from './QuoteCreateWithoutAttachmentsInputSchema';
import { QuoteUncheckedCreateWithoutAttachmentsInputSchema } from './QuoteUncheckedCreateWithoutAttachmentsInputSchema';

export const QuoteCreateOrConnectWithoutAttachmentsInputSchema: z.ZodType<Prisma.QuoteCreateOrConnectWithoutAttachmentsInput> = z.strictObject({
  where: z.lazy(() => QuoteWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => QuoteCreateWithoutAttachmentsInputSchema), z.lazy(() => QuoteUncheckedCreateWithoutAttachmentsInputSchema) ]),
});

export default QuoteCreateOrConnectWithoutAttachmentsInputSchema;
