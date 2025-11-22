import type { Prisma } from '@/prisma/client';

import { z } from 'zod';

export const BoolFieldUpdateOperationsInputSchema: z.ZodType<Prisma.BoolFieldUpdateOperationsInput> = z.strictObject({
  set: z.boolean().optional(),
});

export default BoolFieldUpdateOperationsInputSchema;
