import type { Prisma } from '@/prisma/client';

import { z } from 'zod';
import { QuoteCreateWithoutAttachmentsInputSchema } from './QuoteCreateWithoutAttachmentsInputSchema';
import { QuoteUncheckedCreateWithoutAttachmentsInputSchema } from './QuoteUncheckedCreateWithoutAttachmentsInputSchema';
import { QuoteCreateOrConnectWithoutAttachmentsInputSchema } from './QuoteCreateOrConnectWithoutAttachmentsInputSchema';
import { QuoteUpsertWithoutAttachmentsInputSchema } from './QuoteUpsertWithoutAttachmentsInputSchema';
import { QuoteWhereUniqueInputSchema } from './QuoteWhereUniqueInputSchema';
import { QuoteUpdateToOneWithWhereWithoutAttachmentsInputSchema } from './QuoteUpdateToOneWithWhereWithoutAttachmentsInputSchema';
import { QuoteUpdateWithoutAttachmentsInputSchema } from './QuoteUpdateWithoutAttachmentsInputSchema';
import { QuoteUncheckedUpdateWithoutAttachmentsInputSchema } from './QuoteUncheckedUpdateWithoutAttachmentsInputSchema';

export const QuoteUpdateOneRequiredWithoutAttachmentsNestedInputSchema: z.ZodType<Prisma.QuoteUpdateOneRequiredWithoutAttachmentsNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => QuoteCreateWithoutAttachmentsInputSchema), z.lazy(() => QuoteUncheckedCreateWithoutAttachmentsInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => QuoteCreateOrConnectWithoutAttachmentsInputSchema).optional(),
  upsert: z.lazy(() => QuoteUpsertWithoutAttachmentsInputSchema).optional(),
  connect: z.lazy(() => QuoteWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => QuoteUpdateToOneWithWhereWithoutAttachmentsInputSchema), z.lazy(() => QuoteUpdateWithoutAttachmentsInputSchema), z.lazy(() => QuoteUncheckedUpdateWithoutAttachmentsInputSchema) ]).optional(),
});

export default QuoteUpdateOneRequiredWithoutAttachmentsNestedInputSchema;
