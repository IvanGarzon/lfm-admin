import { z } from 'zod';
import type { Prisma } from '@/prisma/client';
import { InvoiceItemWhereInputSchema } from '../inputTypeSchemas/InvoiceItemWhereInputSchema'
import { InvoiceItemOrderByWithAggregationInputSchema } from '../inputTypeSchemas/InvoiceItemOrderByWithAggregationInputSchema'
import { InvoiceItemScalarFieldEnumSchema } from '../inputTypeSchemas/InvoiceItemScalarFieldEnumSchema'
import { InvoiceItemScalarWhereWithAggregatesInputSchema } from '../inputTypeSchemas/InvoiceItemScalarWhereWithAggregatesInputSchema'

export const InvoiceItemGroupByArgsSchema: z.ZodType<Prisma.InvoiceItemGroupByArgs> = z.object({
  where: InvoiceItemWhereInputSchema.optional(), 
  orderBy: z.union([ InvoiceItemOrderByWithAggregationInputSchema.array(), InvoiceItemOrderByWithAggregationInputSchema ]).optional(),
  by: InvoiceItemScalarFieldEnumSchema.array(), 
  having: InvoiceItemScalarWhereWithAggregatesInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export default InvoiceItemGroupByArgsSchema;
