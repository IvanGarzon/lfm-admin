import { z } from 'zod';
import type { Prisma } from '@/prisma/client';
import { EmployeeWhereInputSchema } from '../inputTypeSchemas/EmployeeWhereInputSchema'
import { EmployeeOrderByWithAggregationInputSchema } from '../inputTypeSchemas/EmployeeOrderByWithAggregationInputSchema'
import { EmployeeScalarFieldEnumSchema } from '../inputTypeSchemas/EmployeeScalarFieldEnumSchema'
import { EmployeeScalarWhereWithAggregatesInputSchema } from '../inputTypeSchemas/EmployeeScalarWhereWithAggregatesInputSchema'

export const EmployeeGroupByArgsSchema: z.ZodType<Prisma.EmployeeGroupByArgs> = z.object({
  where: EmployeeWhereInputSchema.optional(), 
  orderBy: z.union([ EmployeeOrderByWithAggregationInputSchema.array(), EmployeeOrderByWithAggregationInputSchema ]).optional(),
  by: EmployeeScalarFieldEnumSchema.array(), 
  having: EmployeeScalarWhereWithAggregatesInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export default EmployeeGroupByArgsSchema;
