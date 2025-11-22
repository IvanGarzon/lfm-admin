import { z } from 'zod';
import type { Prisma } from '@/prisma/client';
import { QuoteItemCountOutputTypeSelectSchema } from './QuoteItemCountOutputTypeSelectSchema';

export const QuoteItemCountOutputTypeArgsSchema: z.ZodType<Prisma.QuoteItemCountOutputTypeDefaultArgs> = z.object({
  select: z.lazy(() => QuoteItemCountOutputTypeSelectSchema).nullish(),
}).strict();

export default QuoteItemCountOutputTypeSelectSchema;
