import { z } from 'zod';
import type { Prisma } from '@/prisma/client';
import { CustomerUpdateManyMutationInputSchema } from '../inputTypeSchemas/CustomerUpdateManyMutationInputSchema'
import { CustomerUncheckedUpdateManyInputSchema } from '../inputTypeSchemas/CustomerUncheckedUpdateManyInputSchema'
import { CustomerWhereInputSchema } from '../inputTypeSchemas/CustomerWhereInputSchema'

export const CustomerUpdateManyArgsSchema: z.ZodType<Prisma.CustomerUpdateManyArgs> = z.object({
  data: z.union([ CustomerUpdateManyMutationInputSchema, CustomerUncheckedUpdateManyInputSchema ]),
  where: CustomerWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export default CustomerUpdateManyArgsSchema;
