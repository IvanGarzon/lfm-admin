import type { Prisma } from '@/prisma/client';

import { z } from 'zod';
import { StringWithAggregatesFilterSchema } from './StringWithAggregatesFilterSchema';
import { StringNullableWithAggregatesFilterSchema } from './StringNullableWithAggregatesFilterSchema';
import { JsonNullableWithAggregatesFilterSchema } from './JsonNullableWithAggregatesFilterSchema';
import { EnumAuditLevelWithAggregatesFilterSchema } from './EnumAuditLevelWithAggregatesFilterSchema';
import { AuditLevelSchema } from './AuditLevelSchema';
import { DateTimeWithAggregatesFilterSchema } from './DateTimeWithAggregatesFilterSchema';

export const AuditScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.AuditScalarWhereWithAggregatesInput> = z.strictObject({
  AND: z.union([ z.lazy(() => AuditScalarWhereWithAggregatesInputSchema), z.lazy(() => AuditScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  OR: z.lazy(() => AuditScalarWhereWithAggregatesInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => AuditScalarWhereWithAggregatesInputSchema), z.lazy(() => AuditScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  userId: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
  tag: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  event: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  message: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  data: z.lazy(() => JsonNullableWithAggregatesFilterSchema).optional(),
  level: z.union([ z.lazy(() => EnumAuditLevelWithAggregatesFilterSchema), z.lazy(() => AuditLevelSchema) ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema), z.coerce.date() ]).optional(),
});

export default AuditScalarWhereWithAggregatesInputSchema;
