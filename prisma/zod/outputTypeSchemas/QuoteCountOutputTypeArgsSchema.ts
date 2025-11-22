import { z } from 'zod';
import type { Prisma } from '@/prisma/client';
import { QuoteCountOutputTypeSelectSchema } from './QuoteCountOutputTypeSelectSchema';

export const QuoteCountOutputTypeArgsSchema: z.ZodType<Prisma.QuoteCountOutputTypeDefaultArgs> = z.object({
  select: z.lazy(() => QuoteCountOutputTypeSelectSchema).nullish(),
}).strict();

export default QuoteCountOutputTypeSelectSchema;
