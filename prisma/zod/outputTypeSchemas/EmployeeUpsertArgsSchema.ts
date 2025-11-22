import { z } from 'zod';
import type { Prisma } from '@/prisma/client';
import { EmployeeWhereUniqueInputSchema } from '../inputTypeSchemas/EmployeeWhereUniqueInputSchema'
import { EmployeeCreateInputSchema } from '../inputTypeSchemas/EmployeeCreateInputSchema'
import { EmployeeUncheckedCreateInputSchema } from '../inputTypeSchemas/EmployeeUncheckedCreateInputSchema'
import { EmployeeUpdateInputSchema } from '../inputTypeSchemas/EmployeeUpdateInputSchema'
import { EmployeeUncheckedUpdateInputSchema } from '../inputTypeSchemas/EmployeeUncheckedUpdateInputSchema'
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

export const EmployeeUpsertArgsSchema: z.ZodType<Prisma.EmployeeUpsertArgs> = z.object({
  select: EmployeeSelectSchema.optional(),
  where: EmployeeWhereUniqueInputSchema, 
  create: z.union([ EmployeeCreateInputSchema, EmployeeUncheckedCreateInputSchema ]),
  update: z.union([ EmployeeUpdateInputSchema, EmployeeUncheckedUpdateInputSchema ]),
}).strict();

export default EmployeeUpsertArgsSchema;
