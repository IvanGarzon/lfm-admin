import { z } from 'zod';
import type { Prisma } from '@/prisma/client';

export const QuoteCountOutputTypeSelectSchema: z.ZodType<Prisma.QuoteCountOutputTypeSelect> = z.object({
  versions: z.boolean().optional(),
  items: z.boolean().optional(),
  attachments: z.boolean().optional(),
  statusHistory: z.boolean().optional(),
}).strict();

export default QuoteCountOutputTypeSelectSchema;
