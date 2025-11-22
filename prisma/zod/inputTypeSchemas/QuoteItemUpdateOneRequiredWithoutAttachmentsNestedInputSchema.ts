import type { Prisma } from '@/prisma/client';

import { z } from 'zod';
import { QuoteItemCreateWithoutAttachmentsInputSchema } from './QuoteItemCreateWithoutAttachmentsInputSchema';
import { QuoteItemUncheckedCreateWithoutAttachmentsInputSchema } from './QuoteItemUncheckedCreateWithoutAttachmentsInputSchema';
import { QuoteItemCreateOrConnectWithoutAttachmentsInputSchema } from './QuoteItemCreateOrConnectWithoutAttachmentsInputSchema';
import { QuoteItemUpsertWithoutAttachmentsInputSchema } from './QuoteItemUpsertWithoutAttachmentsInputSchema';
import { QuoteItemWhereUniqueInputSchema } from './QuoteItemWhereUniqueInputSchema';
import { QuoteItemUpdateToOneWithWhereWithoutAttachmentsInputSchema } from './QuoteItemUpdateToOneWithWhereWithoutAttachmentsInputSchema';
import { QuoteItemUpdateWithoutAttachmentsInputSchema } from './QuoteItemUpdateWithoutAttachmentsInputSchema';
import { QuoteItemUncheckedUpdateWithoutAttachmentsInputSchema } from './QuoteItemUncheckedUpdateWithoutAttachmentsInputSchema';

export const QuoteItemUpdateOneRequiredWithoutAttachmentsNestedInputSchema: z.ZodType<Prisma.QuoteItemUpdateOneRequiredWithoutAttachmentsNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => QuoteItemCreateWithoutAttachmentsInputSchema), z.lazy(() => QuoteItemUncheckedCreateWithoutAttachmentsInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => QuoteItemCreateOrConnectWithoutAttachmentsInputSchema).optional(),
  upsert: z.lazy(() => QuoteItemUpsertWithoutAttachmentsInputSchema).optional(),
  connect: z.lazy(() => QuoteItemWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => QuoteItemUpdateToOneWithWhereWithoutAttachmentsInputSchema), z.lazy(() => QuoteItemUpdateWithoutAttachmentsInputSchema), z.lazy(() => QuoteItemUncheckedUpdateWithoutAttachmentsInputSchema) ]).optional(),
});

export default QuoteItemUpdateOneRequiredWithoutAttachmentsNestedInputSchema;
