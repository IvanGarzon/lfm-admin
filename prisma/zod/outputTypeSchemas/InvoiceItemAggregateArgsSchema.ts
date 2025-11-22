import { z } from 'zod';
import type { Prisma } from '@/prisma/client';
import { InvoiceItemWhereInputSchema } from '../inputTypeSchemas/InvoiceItemWhereInputSchema'
import { InvoiceItemOrderByWithRelationInputSchema } from '../inputTypeSchemas/InvoiceItemOrderByWithRelationInputSchema'
import { InvoiceItemWhereUniqueInputSchema } from '../inputTypeSchemas/InvoiceItemWhereUniqueInputSchema'

export const InvoiceItemAggregateArgsSchema: z.ZodType<Prisma.InvoiceItemAggregateArgs> = z.object({
  where: InvoiceItemWhereInputSchema.optional(), 
  orderBy: z.union([ InvoiceItemOrderByWithRelationInputSchema.array(), InvoiceItemOrderByWithRelationInputSchema ]).optional(),
  cursor: InvoiceItemWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export default InvoiceItemAggregateArgsSchema;
