import type { Prisma } from '@/prisma/client';

import { z } from 'zod';
import { StatesSchema } from './StatesSchema';

export const NullableEnumStatesFieldUpdateOperationsInputSchema: z.ZodType<Prisma.NullableEnumStatesFieldUpdateOperationsInput> = z.strictObject({
  set: z.lazy(() => StatesSchema).optional().nullable(),
});

export default NullableEnumStatesFieldUpdateOperationsInputSchema;
