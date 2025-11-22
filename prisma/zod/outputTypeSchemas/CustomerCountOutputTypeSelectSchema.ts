import { z } from 'zod';
import type { Prisma } from '@/prisma/client';

export const CustomerCountOutputTypeSelectSchema: z.ZodType<Prisma.CustomerCountOutputTypeSelect> = z.object({
  invoices: z.boolean().optional(),
  quotes: z.boolean().optional(),
}).strict();

export default CustomerCountOutputTypeSelectSchema;
