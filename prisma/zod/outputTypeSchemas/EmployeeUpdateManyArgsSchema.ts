import { z } from 'zod';
import type { Prisma } from '@/prisma/client';
import { EmployeeUpdateManyMutationInputSchema } from '../inputTypeSchemas/EmployeeUpdateManyMutationInputSchema'
import { EmployeeUncheckedUpdateManyInputSchema } from '../inputTypeSchemas/EmployeeUncheckedUpdateManyInputSchema'
import { EmployeeWhereInputSchema } from '../inputTypeSchemas/EmployeeWhereInputSchema'

export const EmployeeUpdateManyArgsSchema: z.ZodType<Prisma.EmployeeUpdateManyArgs> = z.object({
  data: z.union([ EmployeeUpdateManyMutationInputSchema, EmployeeUncheckedUpdateManyInputSchema ]),
  where: EmployeeWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export default EmployeeUpdateManyArgsSchema;
