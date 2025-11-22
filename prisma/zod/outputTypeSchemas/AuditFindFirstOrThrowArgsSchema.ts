import { z } from 'zod';
import type { Prisma } from '@/prisma/client';
import { AuditWhereInputSchema } from '../inputTypeSchemas/AuditWhereInputSchema'
import { AuditOrderByWithRelationInputSchema } from '../inputTypeSchemas/AuditOrderByWithRelationInputSchema'
import { AuditWhereUniqueInputSchema } from '../inputTypeSchemas/AuditWhereUniqueInputSchema'
import { AuditScalarFieldEnumSchema } from '../inputTypeSchemas/AuditScalarFieldEnumSchema'
// Select schema needs to be in file to prevent circular imports
//------------------------------------------------------

export const AuditSelectSchema: z.ZodType<Prisma.AuditSelect> = z.object({
  id: z.boolean().optional(),
  userId: z.boolean().optional(),
  tag: z.boolean().optional(),
  event: z.boolean().optional(),
  message: z.boolean().optional(),
  data: z.boolean().optional(),
  level: z.boolean().optional(),
  createdAt: z.boolean().optional(),
}).strict()

export const AuditFindFirstOrThrowArgsSchema: z.ZodType<Prisma.AuditFindFirstOrThrowArgs> = z.object({
  select: AuditSelectSchema.optional(),
  where: AuditWhereInputSchema.optional(), 
  orderBy: z.union([ AuditOrderByWithRelationInputSchema.array(), AuditOrderByWithRelationInputSchema ]).optional(),
  cursor: AuditWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ AuditScalarFieldEnumSchema, AuditScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export default AuditFindFirstOrThrowArgsSchema;
