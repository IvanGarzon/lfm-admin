import type { Prisma } from '@/prisma/client';

import { z } from 'zod';
import { EmployeeStatusSchema } from './EmployeeStatusSchema';

export const EnumEmployeeStatusFieldUpdateOperationsInputSchema: z.ZodType<Prisma.EnumEmployeeStatusFieldUpdateOperationsInput> = z.strictObject({
  set: z.lazy(() => EmployeeStatusSchema).optional(),
});

export default EnumEmployeeStatusFieldUpdateOperationsInputSchema;
