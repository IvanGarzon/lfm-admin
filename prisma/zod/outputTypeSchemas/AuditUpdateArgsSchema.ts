import { z } from 'zod';
import type { Prisma } from '@/prisma/client';
import { AuditUpdateInputSchema } from '../inputTypeSchemas/AuditUpdateInputSchema'
import { AuditUncheckedUpdateInputSchema } from '../inputTypeSchemas/AuditUncheckedUpdateInputSchema'
import { AuditWhereUniqueInputSchema } from '../inputTypeSchemas/AuditWhereUniqueInputSchema'
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

export const AuditUpdateArgsSchema: z.ZodType<Prisma.AuditUpdateArgs> = z.object({
  select: AuditSelectSchema.optional(),
  data: z.union([ AuditUpdateInputSchema, AuditUncheckedUpdateInputSchema ]),
  where: AuditWhereUniqueInputSchema, 
}).strict();

export default AuditUpdateArgsSchema;
