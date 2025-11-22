import { z } from 'zod';
import type { Prisma } from '@/prisma/client';
import { EmployeeCreateManyInputSchema } from '../inputTypeSchemas/EmployeeCreateManyInputSchema'

export const EmployeeCreateManyAndReturnArgsSchema: z.ZodType<Prisma.EmployeeCreateManyAndReturnArgs> = z.object({
  data: z.union([ EmployeeCreateManyInputSchema, EmployeeCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export default EmployeeCreateManyAndReturnArgsSchema;
