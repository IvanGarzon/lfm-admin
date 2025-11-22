import type { Prisma } from '@/prisma/client';

import { z } from 'zod';
import { QuoteCreateWithoutItemsInputSchema } from './QuoteCreateWithoutItemsInputSchema';
import { QuoteUncheckedCreateWithoutItemsInputSchema } from './QuoteUncheckedCreateWithoutItemsInputSchema';
import { QuoteCreateOrConnectWithoutItemsInputSchema } from './QuoteCreateOrConnectWithoutItemsInputSchema';
import { QuoteUpsertWithoutItemsInputSchema } from './QuoteUpsertWithoutItemsInputSchema';
import { QuoteWhereUniqueInputSchema } from './QuoteWhereUniqueInputSchema';
import { QuoteUpdateToOneWithWhereWithoutItemsInputSchema } from './QuoteUpdateToOneWithWhereWithoutItemsInputSchema';
import { QuoteUpdateWithoutItemsInputSchema } from './QuoteUpdateWithoutItemsInputSchema';
import { QuoteUncheckedUpdateWithoutItemsInputSchema } from './QuoteUncheckedUpdateWithoutItemsInputSchema';

export const QuoteUpdateOneRequiredWithoutItemsNestedInputSchema: z.ZodType<Prisma.QuoteUpdateOneRequiredWithoutItemsNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => QuoteCreateWithoutItemsInputSchema), z.lazy(() => QuoteUncheckedCreateWithoutItemsInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => QuoteCreateOrConnectWithoutItemsInputSchema).optional(),
  upsert: z.lazy(() => QuoteUpsertWithoutItemsInputSchema).optional(),
  connect: z.lazy(() => QuoteWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => QuoteUpdateToOneWithWhereWithoutItemsInputSchema), z.lazy(() => QuoteUpdateWithoutItemsInputSchema), z.lazy(() => QuoteUncheckedUpdateWithoutItemsInputSchema) ]).optional(),
});

export default QuoteUpdateOneRequiredWithoutItemsNestedInputSchema;
