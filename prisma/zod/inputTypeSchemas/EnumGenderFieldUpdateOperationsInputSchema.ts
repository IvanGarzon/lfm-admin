import type { Prisma } from '@/prisma/client';

import { z } from 'zod';
import { GenderSchema } from './GenderSchema';

export const EnumGenderFieldUpdateOperationsInputSchema: z.ZodType<Prisma.EnumGenderFieldUpdateOperationsInput> = z.strictObject({
  set: z.lazy(() => GenderSchema).optional(),
});

export default EnumGenderFieldUpdateOperationsInputSchema;
