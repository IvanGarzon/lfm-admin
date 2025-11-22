import { z } from 'zod';
import type { Prisma } from '@/prisma/client';
import { InvoiceWhereInputSchema } from '../inputTypeSchemas/InvoiceWhereInputSchema'
import { InvoiceOrderByWithAggregationInputSchema } from '../inputTypeSchemas/InvoiceOrderByWithAggregationInputSchema'
import { InvoiceScalarFieldEnumSchema } from '../inputTypeSchemas/InvoiceScalarFieldEnumSchema'
import { InvoiceScalarWhereWithAggregatesInputSchema } from '../inputTypeSchemas/InvoiceScalarWhereWithAggregatesInputSchema'

export const InvoiceGroupByArgsSchema: z.ZodType<Prisma.InvoiceGroupByArgs> = z.object({
  where: InvoiceWhereInputSchema.optional(), 
  orderBy: z.union([ InvoiceOrderByWithAggregationInputSchema.array(), InvoiceOrderByWithAggregationInputSchema ]).optional(),
  by: InvoiceScalarFieldEnumSchema.array(), 
  having: InvoiceScalarWhereWithAggregatesInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export default InvoiceGroupByArgsSchema;
