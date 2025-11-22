import { z } from 'zod';
import type { Prisma } from '@/prisma/client';
import { EmployeeWhereInputSchema } from '../inputTypeSchemas/EmployeeWhereInputSchema'
import { EmployeeOrderByWithRelationInputSchema } from '../inputTypeSchemas/EmployeeOrderByWithRelationInputSchema'
import { EmployeeWhereUniqueInputSchema } from '../inputTypeSchemas/EmployeeWhereUniqueInputSchema'
import { EmployeeScalarFieldEnumSchema } from '../inputTypeSchemas/EmployeeScalarFieldEnumSchema'
// Select schema needs to be in file to prevent circular imports
//------------------------------------------------------

export const EmployeeSelectSchema: z.ZodType<Prisma.EmployeeSelect> = z.object({
  id: z.boolean().optional(),
  firstName: z.boolean().optional(),
  lastName: z.boolean().optional(),
  email: z.boolean().optional(),
  phone: z.boolean().optional(),
  gender: z.boolean().optional(),
  dob: z.boolean().optional(),
  rate: z.boolean().optional(),
  status: z.boolean().optional(),
  avatarUrl: z.boolean().optional(),
  createdAt: z.boolean().optional(),
  updatedAt: z.boolean().optional(),
}).strict()

export const EmployeeFindManyArgsSchema: z.ZodType<Prisma.EmployeeFindManyArgs> = z.object({
  select: EmployeeSelectSchema.optional(),
  where: EmployeeWhereInputSchema.optional(), 
  orderBy: z.union([ EmployeeOrderByWithRelationInputSchema.array(), EmployeeOrderByWithRelationInputSchema ]).optional(),
  cursor: EmployeeWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ EmployeeScalarFieldEnumSchema, EmployeeScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export default EmployeeFindManyArgsSchema;
