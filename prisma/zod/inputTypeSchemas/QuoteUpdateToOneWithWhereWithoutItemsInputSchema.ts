import type { Prisma } from '@/prisma/client';

import { z } from 'zod';
import { QuoteWhereInputSchema } from './QuoteWhereInputSchema';
import { QuoteUpdateWithoutItemsInputSchema } from './QuoteUpdateWithoutItemsInputSchema';
import { QuoteUncheckedUpdateWithoutItemsInputSchema } from './QuoteUncheckedUpdateWithoutItemsInputSchema';

export const QuoteUpdateToOneWithWhereWithoutItemsInputSchema: z.ZodType<Prisma.QuoteUpdateToOneWithWhereWithoutItemsInput> = z.strictObject({
  where: z.lazy(() => QuoteWhereInputSchema).optional(),
  data: z.union([ z.lazy(() => QuoteUpdateWithoutItemsInputSchema), z.lazy(() => QuoteUncheckedUpdateWithoutItemsInputSchema) ]),
});

export default QuoteUpdateToOneWithWhereWithoutItemsInputSchema;
