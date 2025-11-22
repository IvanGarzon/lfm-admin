import { z } from 'zod';
import type { Prisma } from '@/prisma/client';
import { InvoiceCountOutputTypeSelectSchema } from './InvoiceCountOutputTypeSelectSchema';

export const InvoiceCountOutputTypeArgsSchema: z.ZodType<Prisma.InvoiceCountOutputTypeDefaultArgs> = z.object({
  select: z.lazy(() => InvoiceCountOutputTypeSelectSchema).nullish(),
}).strict();

export default InvoiceCountOutputTypeSelectSchema;
