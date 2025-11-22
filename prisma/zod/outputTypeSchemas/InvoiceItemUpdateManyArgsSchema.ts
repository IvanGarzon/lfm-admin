import { z } from 'zod';
import type { Prisma } from '@/prisma/client';
import { InvoiceItemUpdateManyMutationInputSchema } from '../inputTypeSchemas/InvoiceItemUpdateManyMutationInputSchema'
import { InvoiceItemUncheckedUpdateManyInputSchema } from '../inputTypeSchemas/InvoiceItemUncheckedUpdateManyInputSchema'
import { InvoiceItemWhereInputSchema } from '../inputTypeSchemas/InvoiceItemWhereInputSchema'

export const InvoiceItemUpdateManyArgsSchema: z.ZodType<Prisma.InvoiceItemUpdateManyArgs> = z.object({
  data: z.union([ InvoiceItemUpdateManyMutationInputSchema, InvoiceItemUncheckedUpdateManyInputSchema ]),
  where: InvoiceItemWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export default InvoiceItemUpdateManyArgsSchema;
