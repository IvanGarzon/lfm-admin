import type { Prisma } from '@/prisma/client';

import { z } from 'zod';
import { ProductStatusSchema } from './ProductStatusSchema';

export const EnumProductStatusFieldUpdateOperationsInputSchema: z.ZodType<Prisma.EnumProductStatusFieldUpdateOperationsInput> = z.strictObject({
  set: z.lazy(() => ProductStatusSchema).optional(),
});

export default EnumProductStatusFieldUpdateOperationsInputSchema;
