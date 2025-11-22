import type { Prisma } from '@/prisma/client';

import { z } from 'zod';
import { InvoiceStatusSchema } from './InvoiceStatusSchema';

export const EnumInvoiceStatusFieldUpdateOperationsInputSchema: z.ZodType<Prisma.EnumInvoiceStatusFieldUpdateOperationsInput> = z.strictObject({
  set: z.lazy(() => InvoiceStatusSchema).optional(),
});

export default EnumInvoiceStatusFieldUpdateOperationsInputSchema;
