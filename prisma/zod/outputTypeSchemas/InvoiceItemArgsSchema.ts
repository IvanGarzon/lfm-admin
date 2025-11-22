import { z } from 'zod';
import type { Prisma } from '@/prisma/client';
import { InvoiceItemSelectSchema } from '../inputTypeSchemas/InvoiceItemSelectSchema';
import { InvoiceItemIncludeSchema } from '../inputTypeSchemas/InvoiceItemIncludeSchema';

export const InvoiceItemArgsSchema: z.ZodType<Prisma.InvoiceItemDefaultArgs> = z.object({
  select: z.lazy(() => InvoiceItemSelectSchema).optional(),
  include: z.lazy(() => InvoiceItemIncludeSchema).optional(),
}).strict();

export default InvoiceItemArgsSchema;
