import type { Prisma } from '@/prisma/client';

import { z } from 'zod';
import { StringFilterSchema } from './StringFilterSchema';
import { StringNullableFilterSchema } from './StringNullableFilterSchema';
import { JsonNullableFilterSchema } from './JsonNullableFilterSchema';
import { EnumAuditLevelFilterSchema } from './EnumAuditLevelFilterSchema';
import { AuditLevelSchema } from './AuditLevelSchema';
import { DateTimeFilterSchema } from './DateTimeFilterSchema';

export const AuditWhereInputSchema: z.ZodType<Prisma.AuditWhereInput> = z.strictObject({
  AND: z.union([ z.lazy(() => AuditWhereInputSchema), z.lazy(() => AuditWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => AuditWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => AuditWhereInputSchema), z.lazy(() => AuditWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  userId: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  tag: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  event: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  message: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  data: z.lazy(() => JsonNullableFilterSchema).optional(),
  level: z.union([ z.lazy(() => EnumAuditLevelFilterSchema), z.lazy(() => AuditLevelSchema) ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
});

export default AuditWhereInputSchema;
