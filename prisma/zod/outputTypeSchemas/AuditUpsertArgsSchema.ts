import { z } from 'zod';
import type { Prisma } from '@/prisma/client';
import { AuditWhereUniqueInputSchema } from '../inputTypeSchemas/AuditWhereUniqueInputSchema'
import { AuditCreateInputSchema } from '../inputTypeSchemas/AuditCreateInputSchema'
import { AuditUncheckedCreateInputSchema } from '../inputTypeSchemas/AuditUncheckedCreateInputSchema'
import { AuditUpdateInputSchema } from '../inputTypeSchemas/AuditUpdateInputSchema'
import { AuditUncheckedUpdateInputSchema } from '../inputTypeSchemas/AuditUncheckedUpdateInputSchema'
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

export const AuditUpsertArgsSchema: z.ZodType<Prisma.AuditUpsertArgs> = z.object({
  select: AuditSelectSchema.optional(),
  where: AuditWhereUniqueInputSchema, 
  create: z.union([ AuditCreateInputSchema, AuditUncheckedCreateInputSchema ]),
  update: z.union([ AuditUpdateInputSchema, AuditUncheckedUpdateInputSchema ]),
}).strict();

export default AuditUpsertArgsSchema;
