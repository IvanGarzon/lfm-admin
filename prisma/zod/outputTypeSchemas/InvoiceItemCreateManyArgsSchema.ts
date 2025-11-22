import { z } from 'zod';
import type { Prisma } from '@/prisma/client';
import { InvoiceItemCreateManyInputSchema } from '../inputTypeSchemas/InvoiceItemCreateManyInputSchema'

export const InvoiceItemCreateManyArgsSchema: z.ZodType<Prisma.InvoiceItemCreateManyArgs> = z.object({
  data: z.union([ InvoiceItemCreateManyInputSchema, InvoiceItemCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export default InvoiceItemCreateManyArgsSchema;
