import { z } from 'zod';
import type { Prisma } from '@/prisma/client';
import { EmployeeWhereInputSchema } from '../inputTypeSchemas/EmployeeWhereInputSchema'
import { EmployeeOrderByWithRelationInputSchema } from '../inputTypeSchemas/EmployeeOrderByWithRelationInputSchema'
import { EmployeeWhereUniqueInputSchema } from '../inputTypeSchemas/EmployeeWhereUniqueInputSchema'

export const EmployeeAggregateArgsSchema: z.ZodType<Prisma.EmployeeAggregateArgs> = z.object({
  where: EmployeeWhereInputSchema.optional(), 
  orderBy: z.union([ EmployeeOrderByWithRelationInputSchema.array(), EmployeeOrderByWithRelationInputSchema ]).optional(),
  cursor: EmployeeWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export default EmployeeAggregateArgsSchema;
