import { z } from 'zod';
import type { Prisma } from '@/prisma/client';

export const InvoiceCountOutputTypeSelectSchema: z.ZodType<Prisma.InvoiceCountOutputTypeSelect> = z.object({
  items: z.boolean().optional(),
}).strict();

export default InvoiceCountOutputTypeSelectSchema;
