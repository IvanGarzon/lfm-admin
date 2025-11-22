import { z } from 'zod';
import type { Prisma } from '@/prisma/client';
import { AuditWhereInputSchema } from '../inputTypeSchemas/AuditWhereInputSchema'

export const AuditDeleteManyArgsSchema: z.ZodType<Prisma.AuditDeleteManyArgs> = z.object({
  where: AuditWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export default AuditDeleteManyArgsSchema;
