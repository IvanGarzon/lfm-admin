import { z } from 'zod';
import type { Prisma } from '@/prisma/client';
import { EmployeeWhereInputSchema } from '../inputTypeSchemas/EmployeeWhereInputSchema'

export const EmployeeDeleteManyArgsSchema: z.ZodType<Prisma.EmployeeDeleteManyArgs> = z.object({
  where: EmployeeWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export default EmployeeDeleteManyArgsSchema;
