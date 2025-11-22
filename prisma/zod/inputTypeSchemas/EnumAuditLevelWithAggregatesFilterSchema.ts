import type { Prisma } from '@/prisma/client';

import { z } from 'zod';
import { AuditLevelSchema } from './AuditLevelSchema';
import { NestedEnumAuditLevelWithAggregatesFilterSchema } from './NestedEnumAuditLevelWithAggregatesFilterSchema';
import { NestedIntFilterSchema } from './NestedIntFilterSchema';
import { NestedEnumAuditLevelFilterSchema } from './NestedEnumAuditLevelFilterSchema';

export const EnumAuditLevelWithAggregatesFilterSchema: z.ZodType<Prisma.EnumAuditLevelWithAggregatesFilter> = z.strictObject({
  equals: z.lazy(() => AuditLevelSchema).optional(),
  in: z.lazy(() => AuditLevelSchema).array().optional(),
  notIn: z.lazy(() => AuditLevelSchema).array().optional(),
  not: z.union([ z.lazy(() => AuditLevelSchema), z.lazy(() => NestedEnumAuditLevelWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedEnumAuditLevelFilterSchema).optional(),
  _max: z.lazy(() => NestedEnumAuditLevelFilterSchema).optional(),
});

export default EnumAuditLevelWithAggregatesFilterSchema;
