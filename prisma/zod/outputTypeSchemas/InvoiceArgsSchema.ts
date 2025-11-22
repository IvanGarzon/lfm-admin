import { z } from 'zod';
import type { Prisma } from '@/prisma/client';
import { InvoiceSelectSchema } from '../inputTypeSchemas/InvoiceSelectSchema';
import { InvoiceIncludeSchema } from '../inputTypeSchemas/InvoiceIncludeSchema';

export const InvoiceArgsSchema: z.ZodType<Prisma.InvoiceDefaultArgs> = z.object({
  select: z.lazy(() => InvoiceSelectSchema).optional(),
  include: z.lazy(() => InvoiceIncludeSchema).optional(),
}).strict();

export default InvoiceArgsSchema;
