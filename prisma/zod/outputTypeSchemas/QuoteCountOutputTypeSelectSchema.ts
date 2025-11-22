import { z } from 'zod';
import type { Prisma } from '@/prisma/client';

export const QuoteCountOutputTypeSelectSchema: z.ZodType<Prisma.QuoteCountOutputTypeSelect> = z.object({
  items: z.boolean().optional(),
  attachments: z.boolean().optional(),
}).strict();

export default QuoteCountOutputTypeSelectSchema;
