import { z } from 'zod';
import type { Prisma } from '@/prisma/client';
import { AuditCreateInputSchema } from '../inputTypeSchemas/AuditCreateInputSchema'
import { AuditUncheckedCreateInputSchema } from '../inputTypeSchemas/AuditUncheckedCreateInputSchema'
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

export const AuditCreateArgsSchema: z.ZodType<Prisma.AuditCreateArgs> = z.object({
  select: AuditSelectSchema.optional(),
  data: z.union([ AuditCreateInputSchema, AuditUncheckedCreateInputSchema ]),
}).strict();

export default AuditCreateArgsSchema;
