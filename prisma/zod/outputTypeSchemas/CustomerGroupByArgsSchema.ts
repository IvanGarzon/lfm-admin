import { z } from 'zod';
import type { Prisma } from '@/prisma/client';
import { CustomerWhereInputSchema } from '../inputTypeSchemas/CustomerWhereInputSchema'
import { CustomerOrderByWithAggregationInputSchema } from '../inputTypeSchemas/CustomerOrderByWithAggregationInputSchema'
import { CustomerScalarFieldEnumSchema } from '../inputTypeSchemas/CustomerScalarFieldEnumSchema'
import { CustomerScalarWhereWithAggregatesInputSchema } from '../inputTypeSchemas/CustomerScalarWhereWithAggregatesInputSchema'

export const CustomerGroupByArgsSchema: z.ZodType<Prisma.CustomerGroupByArgs> = z.object({
  where: CustomerWhereInputSchema.optional(), 
  orderBy: z.union([ CustomerOrderByWithAggregationInputSchema.array(), CustomerOrderByWithAggregationInputSchema ]).optional(),
  by: CustomerScalarFieldEnumSchema.array(), 
  having: CustomerScalarWhereWithAggregatesInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export default CustomerGroupByArgsSchema;
