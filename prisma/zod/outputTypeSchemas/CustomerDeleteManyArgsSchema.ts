import { z } from 'zod';
import type { Prisma } from '@/prisma/client';
import { CustomerWhereInputSchema } from '../inputTypeSchemas/CustomerWhereInputSchema'

export const CustomerDeleteManyArgsSchema: z.ZodType<Prisma.CustomerDeleteManyArgs> = z.object({
  where: CustomerWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export default CustomerDeleteManyArgsSchema;
