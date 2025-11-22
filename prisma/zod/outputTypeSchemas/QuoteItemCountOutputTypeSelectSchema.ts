import { z } from 'zod';
import type { Prisma } from '@/prisma/client';

export const QuoteItemCountOutputTypeSelectSchema: z.ZodType<Prisma.QuoteItemCountOutputTypeSelect> = z.object({
  attachments: z.boolean().optional(),
}).strict();

export default QuoteItemCountOutputTypeSelectSchema;
