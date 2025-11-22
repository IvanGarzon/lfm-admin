import { z } from 'zod';
import type { Prisma } from '@/prisma/client';
import { AuditCreateManyInputSchema } from '../inputTypeSchemas/AuditCreateManyInputSchema'

export const AuditCreateManyAndReturnArgsSchema: z.ZodType<Prisma.AuditCreateManyAndReturnArgs> = z.object({
  data: z.union([ AuditCreateManyInputSchema, AuditCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export default AuditCreateManyAndReturnArgsSchema;
