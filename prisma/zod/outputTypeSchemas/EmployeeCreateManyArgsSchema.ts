import { z } from 'zod';
import type { Prisma } from '@/prisma/client';
import { EmployeeCreateManyInputSchema } from '../inputTypeSchemas/EmployeeCreateManyInputSchema'

export const EmployeeCreateManyArgsSchema: z.ZodType<Prisma.EmployeeCreateManyArgs> = z.object({
  data: z.union([ EmployeeCreateManyInputSchema, EmployeeCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export default EmployeeCreateManyArgsSchema;
