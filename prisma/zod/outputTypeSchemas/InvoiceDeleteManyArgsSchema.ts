import { z } from 'zod';
import type { Prisma } from '@/prisma/client';
import { InvoiceWhereInputSchema } from '../inputTypeSchemas/InvoiceWhereInputSchema'

export const InvoiceDeleteManyArgsSchema: z.ZodType<Prisma.InvoiceDeleteManyArgs> = z.object({
  where: InvoiceWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export default InvoiceDeleteManyArgsSchema;
