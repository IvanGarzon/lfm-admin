import type { Prisma } from '@/prisma/client';

import { z } from 'zod';
import { QuoteCreateWithoutAttachmentsInputSchema } from './QuoteCreateWithoutAttachmentsInputSchema';
import { QuoteUncheckedCreateWithoutAttachmentsInputSchema } from './QuoteUncheckedCreateWithoutAttachmentsInputSchema';
import { QuoteCreateOrConnectWithoutAttachmentsInputSchema } from './QuoteCreateOrConnectWithoutAttachmentsInputSchema';
import { QuoteWhereUniqueInputSchema } from './QuoteWhereUniqueInputSchema';

export const QuoteCreateNestedOneWithoutAttachmentsInputSchema: z.ZodType<Prisma.QuoteCreateNestedOneWithoutAttachmentsInput> = z.strictObject({
  create: z.union([ z.lazy(() => QuoteCreateWithoutAttachmentsInputSchema), z.lazy(() => QuoteUncheckedCreateWithoutAttachmentsInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => QuoteCreateOrConnectWithoutAttachmentsInputSchema).optional(),
  connect: z.lazy(() => QuoteWhereUniqueInputSchema).optional(),
});

export default QuoteCreateNestedOneWithoutAttachmentsInputSchema;
