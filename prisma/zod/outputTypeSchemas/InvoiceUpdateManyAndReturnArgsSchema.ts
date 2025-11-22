import { z } from 'zod';
import type { Prisma } from '@/prisma/client';
import { InvoiceUpdateManyMutationInputSchema } from '../inputTypeSchemas/InvoiceUpdateManyMutationInputSchema'
import { InvoiceUncheckedUpdateManyInputSchema } from '../inputTypeSchemas/InvoiceUncheckedUpdateManyInputSchema'
import { InvoiceWhereInputSchema } from '../inputTypeSchemas/InvoiceWhereInputSchema'

export const InvoiceUpdateManyAndReturnArgsSchema: z.ZodType<Prisma.InvoiceUpdateManyAndReturnArgs> = z.object({
  data: z.union([ InvoiceUpdateManyMutationInputSchema, InvoiceUncheckedUpdateManyInputSchema ]),
  where: InvoiceWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export default InvoiceUpdateManyAndReturnArgsSchema;
