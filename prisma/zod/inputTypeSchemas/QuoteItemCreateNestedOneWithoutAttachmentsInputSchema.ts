import type { Prisma } from '@/prisma/client';

import { z } from 'zod';
import { QuoteItemCreateWithoutAttachmentsInputSchema } from './QuoteItemCreateWithoutAttachmentsInputSchema';
import { QuoteItemUncheckedCreateWithoutAttachmentsInputSchema } from './QuoteItemUncheckedCreateWithoutAttachmentsInputSchema';
import { QuoteItemCreateOrConnectWithoutAttachmentsInputSchema } from './QuoteItemCreateOrConnectWithoutAttachmentsInputSchema';
import { QuoteItemWhereUniqueInputSchema } from './QuoteItemWhereUniqueInputSchema';

export const QuoteItemCreateNestedOneWithoutAttachmentsInputSchema: z.ZodType<Prisma.QuoteItemCreateNestedOneWithoutAttachmentsInput> = z.strictObject({
  create: z.union([ z.lazy(() => QuoteItemCreateWithoutAttachmentsInputSchema), z.lazy(() => QuoteItemUncheckedCreateWithoutAttachmentsInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => QuoteItemCreateOrConnectWithoutAttachmentsInputSchema).optional(),
  connect: z.lazy(() => QuoteItemWhereUniqueInputSchema).optional(),
});

export default QuoteItemCreateNestedOneWithoutAttachmentsInputSchema;
