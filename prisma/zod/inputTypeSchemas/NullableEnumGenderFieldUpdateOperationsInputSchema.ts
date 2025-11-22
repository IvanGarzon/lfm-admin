import type { Prisma } from '@/prisma/client';

import { z } from 'zod';
import { GenderSchema } from './GenderSchema';

export const NullableEnumGenderFieldUpdateOperationsInputSchema: z.ZodType<Prisma.NullableEnumGenderFieldUpdateOperationsInput> = z.strictObject({
  set: z.lazy(() => GenderSchema).optional().nullable(),
});

export default NullableEnumGenderFieldUpdateOperationsInputSchema;
