import type { Prisma } from '@/prisma/client';

import { z } from 'zod';
import { AuditLevelSchema } from './AuditLevelSchema';

export const NestedEnumAuditLevelFilterSchema: z.ZodType<Prisma.NestedEnumAuditLevelFilter> = z.strictObject({
  equals: z.lazy(() => AuditLevelSchema).optional(),
  in: z.lazy(() => AuditLevelSchema).array().optional(),
  notIn: z.lazy(() => AuditLevelSchema).array().optional(),
  not: z.union([ z.lazy(() => AuditLevelSchema), z.lazy(() => NestedEnumAuditLevelFilterSchema) ]).optional(),
});

export default NestedEnumAuditLevelFilterSchema;
