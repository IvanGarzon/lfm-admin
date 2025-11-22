import type { Prisma } from '@/prisma/client';

import { z } from 'zod';
import { QuoteStatusSchema } from './QuoteStatusSchema';

export const EnumQuoteStatusFieldUpdateOperationsInputSchema: z.ZodType<Prisma.EnumQuoteStatusFieldUpdateOperationsInput> = z.strictObject({
  set: z.lazy(() => QuoteStatusSchema).optional(),
});

export default EnumQuoteStatusFieldUpdateOperationsInputSchema;
