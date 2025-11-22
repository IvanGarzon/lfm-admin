import { z } from 'zod';
import type { Prisma } from '@/prisma/client';
import { AuditWhereInputSchema } from '../inputTypeSchemas/AuditWhereInputSchema'
import { AuditOrderByWithAggregationInputSchema } from '../inputTypeSchemas/AuditOrderByWithAggregationInputSchema'
import { AuditScalarFieldEnumSchema } from '../inputTypeSchemas/AuditScalarFieldEnumSchema'
import { AuditScalarWhereWithAggregatesInputSchema } from '../inputTypeSchemas/AuditScalarWhereWithAggregatesInputSchema'

export const AuditGroupByArgsSchema: z.ZodType<Prisma.AuditGroupByArgs> = z.object({
  where: AuditWhereInputSchema.optional(), 
  orderBy: z.union([ AuditOrderByWithAggregationInputSchema.array(), AuditOrderByWithAggregationInputSchema ]).optional(),
  by: AuditScalarFieldEnumSchema.array(), 
  having: AuditScalarWhereWithAggregatesInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export default AuditGroupByArgsSchema;
