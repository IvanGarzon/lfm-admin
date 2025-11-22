import { z } from 'zod';
import type { Prisma } from '@/prisma/client';
import { InvoiceCreateManyInputSchema } from '../inputTypeSchemas/InvoiceCreateManyInputSchema'

export const InvoiceCreateManyArgsSchema: z.ZodType<Prisma.InvoiceCreateManyArgs> = z.object({
  data: z.union([ InvoiceCreateManyInputSchema, InvoiceCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export default InvoiceCreateManyArgsSchema;
