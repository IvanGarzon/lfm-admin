import { z } from 'zod';
import type { Prisma } from '@/prisma/client';
import { InvoiceItemCreateManyInputSchema } from '../inputTypeSchemas/InvoiceItemCreateManyInputSchema'

export const InvoiceItemCreateManyAndReturnArgsSchema: z.ZodType<Prisma.InvoiceItemCreateManyAndReturnArgs> = z.object({
  data: z.union([ InvoiceItemCreateManyInputSchema, InvoiceItemCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export default InvoiceItemCreateManyAndReturnArgsSchema;
