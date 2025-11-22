import type { Prisma } from '@/prisma/client';

import { z } from 'zod';
import { AuditLevelSchema } from './AuditLevelSchema';

export const EnumAuditLevelFieldUpdateOperationsInputSchema: z.ZodType<Prisma.EnumAuditLevelFieldUpdateOperationsInput> = z.strictObject({
  set: z.lazy(() => AuditLevelSchema).optional(),
});

export default EnumAuditLevelFieldUpdateOperationsInputSchema;
