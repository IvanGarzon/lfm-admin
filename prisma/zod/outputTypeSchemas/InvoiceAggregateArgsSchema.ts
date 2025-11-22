import { z } from 'zod';
import type { Prisma } from '@/prisma/client';
import { InvoiceWhereInputSchema } from '../inputTypeSchemas/InvoiceWhereInputSchema'
import { InvoiceOrderByWithRelationInputSchema } from '../inputTypeSchemas/InvoiceOrderByWithRelationInputSchema'
import { InvoiceWhereUniqueInputSchema } from '../inputTypeSchemas/InvoiceWhereUniqueInputSchema'

export const InvoiceAggregateArgsSchema: z.ZodType<Prisma.InvoiceAggregateArgs> = z.object({
  where: InvoiceWhereInputSchema.optional(), 
  orderBy: z.union([ InvoiceOrderByWithRelationInputSchema.array(), InvoiceOrderByWithRelationInputSchema ]).optional(),
  cursor: InvoiceWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export default InvoiceAggregateArgsSchema;
