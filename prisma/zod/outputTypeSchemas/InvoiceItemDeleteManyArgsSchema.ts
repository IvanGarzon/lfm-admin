import { z } from 'zod';
import type { Prisma } from '@/prisma/client';
import { InvoiceItemWhereInputSchema } from '../inputTypeSchemas/InvoiceItemWhereInputSchema'

export const InvoiceItemDeleteManyArgsSchema: z.ZodType<Prisma.InvoiceItemDeleteManyArgs> = z.object({
  where: InvoiceItemWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export default InvoiceItemDeleteManyArgsSchema;
