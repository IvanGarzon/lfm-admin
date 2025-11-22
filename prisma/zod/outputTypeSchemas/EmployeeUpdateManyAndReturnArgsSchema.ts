import { z } from 'zod';
import type { Prisma } from '@/prisma/client';
import { EmployeeUpdateManyMutationInputSchema } from '../inputTypeSchemas/EmployeeUpdateManyMutationInputSchema'
import { EmployeeUncheckedUpdateManyInputSchema } from '../inputTypeSchemas/EmployeeUncheckedUpdateManyInputSchema'
import { EmployeeWhereInputSchema } from '../inputTypeSchemas/EmployeeWhereInputSchema'

export const EmployeeUpdateManyAndReturnArgsSchema: z.ZodType<Prisma.EmployeeUpdateManyAndReturnArgs> = z.object({
  data: z.union([ EmployeeUpdateManyMutationInputSchema, EmployeeUncheckedUpdateManyInputSchema ]),
  where: EmployeeWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export default EmployeeUpdateManyAndReturnArgsSchema;
