import { z } from 'zod';
import type { Prisma } from '@/prisma/client';
import { EmployeeWhereUniqueInputSchema } from '../inputTypeSchemas/EmployeeWhereUniqueInputSchema'
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

export const EmployeeFindUniqueOrThrowArgsSchema: z.ZodType<Prisma.EmployeeFindUniqueOrThrowArgs> = z.object({
  select: EmployeeSelectSchema.optional(),
  where: EmployeeWhereUniqueInputSchema, 
}).strict();

export default EmployeeFindUniqueOrThrowArgsSchema;
