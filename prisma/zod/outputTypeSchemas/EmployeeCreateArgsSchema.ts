import { z } from 'zod';
import type { Prisma } from '@/prisma/client';
import { EmployeeCreateInputSchema } from '../inputTypeSchemas/EmployeeCreateInputSchema'
import { EmployeeUncheckedCreateInputSchema } from '../inputTypeSchemas/EmployeeUncheckedCreateInputSchema'
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

export const EmployeeCreateArgsSchema: z.ZodType<Prisma.EmployeeCreateArgs> = z.object({
  select: EmployeeSelectSchema.optional(),
  data: z.union([ EmployeeCreateInputSchema, EmployeeUncheckedCreateInputSchema ]),
}).strict();

export default EmployeeCreateArgsSchema;
