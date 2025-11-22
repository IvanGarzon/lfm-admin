import type { Prisma } from '@/prisma/client';

import { z } from 'zod';
import { QuoteUpdateWithoutItemsInputSchema } from './QuoteUpdateWithoutItemsInputSchema';
import { QuoteUncheckedUpdateWithoutItemsInputSchema } from './QuoteUncheckedUpdateWithoutItemsInputSchema';
import { QuoteCreateWithoutItemsInputSchema } from './QuoteCreateWithoutItemsInputSchema';
import { QuoteUncheckedCreateWithoutItemsInputSchema } from './QuoteUncheckedCreateWithoutItemsInputSchema';
import { QuoteWhereInputSchema } from './QuoteWhereInputSchema';

export const QuoteUpsertWithoutItemsInputSchema: z.ZodType<Prisma.QuoteUpsertWithoutItemsInput> = z.strictObject({
  update: z.union([ z.lazy(() => QuoteUpdateWithoutItemsInputSchema), z.lazy(() => QuoteUncheckedUpdateWithoutItemsInputSchema) ]),
  create: z.union([ z.lazy(() => QuoteCreateWithoutItemsInputSchema), z.lazy(() => QuoteUncheckedCreateWithoutItemsInputSchema) ]),
  where: z.lazy(() => QuoteWhereInputSchema).optional(),
});

export default QuoteUpsertWithoutItemsInputSchema;
