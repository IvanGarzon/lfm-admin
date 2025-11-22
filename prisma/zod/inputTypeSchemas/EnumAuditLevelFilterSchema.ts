import type { Prisma } from '@/prisma/client';

import { z } from 'zod';
import { AuditLevelSchema } from './AuditLevelSchema';
import { NestedEnumAuditLevelFilterSchema } from './NestedEnumAuditLevelFilterSchema';

export const EnumAuditLevelFilterSchema: z.ZodType<Prisma.EnumAuditLevelFilter> = z.strictObject({
  equals: z.lazy(() => AuditLevelSchema).optional(),
  in: z.lazy(() => AuditLevelSchema).array().optional(),
  notIn: z.lazy(() => AuditLevelSchema).array().optional(),
  not: z.union([ z.lazy(() => AuditLevelSchema), z.lazy(() => NestedEnumAuditLevelFilterSchema) ]).optional(),
});

export default EnumAuditLevelFilterSchema;
