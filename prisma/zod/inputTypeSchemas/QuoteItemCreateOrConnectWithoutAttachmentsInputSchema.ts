import type { Prisma } from '@/prisma/client';

import { z } from 'zod';
import { QuoteItemWhereUniqueInputSchema } from './QuoteItemWhereUniqueInputSchema';
import { QuoteItemCreateWithoutAttachmentsInputSchema } from './QuoteItemCreateWithoutAttachmentsInputSchema';
import { QuoteItemUncheckedCreateWithoutAttachmentsInputSchema } from './QuoteItemUncheckedCreateWithoutAttachmentsInputSchema';

export const QuoteItemCreateOrConnectWithoutAttachmentsInputSchema: z.ZodType<Prisma.QuoteItemCreateOrConnectWithoutAttachmentsInput> = z.strictObject({
  where: z.lazy(() => QuoteItemWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => QuoteItemCreateWithoutAttachmentsInputSchema), z.lazy(() => QuoteItemUncheckedCreateWithoutAttachmentsInputSchema) ]),
});

export default QuoteItemCreateOrConnectWithoutAttachmentsInputSchema;
