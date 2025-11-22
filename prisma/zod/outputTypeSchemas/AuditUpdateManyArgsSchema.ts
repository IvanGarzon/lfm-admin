import { z } from 'zod';
import type { Prisma } from '@/prisma/client';
import { AuditUpdateManyMutationInputSchema } from '../inputTypeSchemas/AuditUpdateManyMutationInputSchema'
import { AuditUncheckedUpdateManyInputSchema } from '../inputTypeSchemas/AuditUncheckedUpdateManyInputSchema'
import { AuditWhereInputSchema } from '../inputTypeSchemas/AuditWhereInputSchema'

export const AuditUpdateManyArgsSchema: z.ZodType<Prisma.AuditUpdateManyArgs> = z.object({
  data: z.union([ AuditUpdateManyMutationInputSchema, AuditUncheckedUpdateManyInputSchema ]),
  where: AuditWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export default AuditUpdateManyArgsSchema;
