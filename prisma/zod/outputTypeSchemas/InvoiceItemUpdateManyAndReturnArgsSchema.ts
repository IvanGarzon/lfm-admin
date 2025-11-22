import { z } from 'zod';
import type { Prisma } from '@/prisma/client';
import { InvoiceItemUpdateManyMutationInputSchema } from '../inputTypeSchemas/InvoiceItemUpdateManyMutationInputSchema'
import { InvoiceItemUncheckedUpdateManyInputSchema } from '../inputTypeSchemas/InvoiceItemUncheckedUpdateManyInputSchema'
import { InvoiceItemWhereInputSchema } from '../inputTypeSchemas/InvoiceItemWhereInputSchema'

export const InvoiceItemUpdateManyAndReturnArgsSchema: z.ZodType<Prisma.InvoiceItemUpdateManyAndReturnArgs> = z.object({
  data: z.union([ InvoiceItemUpdateManyMutationInputSchema, InvoiceItemUncheckedUpdateManyInputSchema ]),
  where: InvoiceItemWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export default InvoiceItemUpdateManyAndReturnArgsSchema;
