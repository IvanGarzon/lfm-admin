import { z } from 'zod';
import type { Prisma } from '@/prisma/client';

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

export default AuditSelectSchema;
