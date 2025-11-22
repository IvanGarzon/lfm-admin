import type { Prisma } from '@/prisma/client';

import { z } from 'zod';
import { CustomerStatusSchema } from './CustomerStatusSchema';

export const EnumCustomerStatusFieldUpdateOperationsInputSchema: z.ZodType<Prisma.EnumCustomerStatusFieldUpdateOperationsInput> = z.strictObject({
  set: z.lazy(() => CustomerStatusSchema).optional(),
});

export default EnumCustomerStatusFieldUpdateOperationsInputSchema;
