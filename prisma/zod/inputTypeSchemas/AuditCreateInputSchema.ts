import type { Prisma } from '@/prisma/client';

import { z } from 'zod';
import { NullableJsonNullValueInputSchema } from './NullableJsonNullValueInputSchema';
import { InputJsonValueSchema } from './InputJsonValueSchema';
import { AuditLevelSchema } from './AuditLevelSchema';

export const AuditCreateInputSchema: z.ZodType<Prisma.AuditCreateInput> = z.strictObject({
  id: z.uuid().optional(),
  userId: z.string().optional().nullable(),
  tag: z.string(),
  event: z.string(),
  message: z.string(),
  data: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  level: z.lazy(() => AuditLevelSchema).optional(),
  createdAt: z.coerce.date().optional(),
});

export default AuditCreateInputSchema;
