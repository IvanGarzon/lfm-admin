import { z } from 'zod';
import type { Prisma } from '@/prisma/client';
import { AuditWhereInputSchema } from '../inputTypeSchemas/AuditWhereInputSchema'
import { AuditOrderByWithRelationInputSchema } from '../inputTypeSchemas/AuditOrderByWithRelationInputSchema'
import { AuditWhereUniqueInputSchema } from '../inputTypeSchemas/AuditWhereUniqueInputSchema'

export const AuditAggregateArgsSchema: z.ZodType<Prisma.AuditAggregateArgs> = z.object({
  where: AuditWhereInputSchema.optional(), 
  orderBy: z.union([ AuditOrderByWithRelationInputSchema.array(), AuditOrderByWithRelationInputSchema ]).optional(),
  cursor: AuditWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export default AuditAggregateArgsSchema;
