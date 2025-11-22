import { z } from 'zod';
import type { Prisma } from '@/prisma/client';
import { CustomerWhereInputSchema } from '../inputTypeSchemas/CustomerWhereInputSchema'
import { CustomerOrderByWithRelationInputSchema } from '../inputTypeSchemas/CustomerOrderByWithRelationInputSchema'
import { CustomerWhereUniqueInputSchema } from '../inputTypeSchemas/CustomerWhereUniqueInputSchema'

export const CustomerAggregateArgsSchema: z.ZodType<Prisma.CustomerAggregateArgs> = z.object({
  where: CustomerWhereInputSchema.optional(), 
  orderBy: z.union([ CustomerOrderByWithRelationInputSchema.array(), CustomerOrderByWithRelationInputSchema ]).optional(),
  cursor: CustomerWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export default CustomerAggregateArgsSchema;
