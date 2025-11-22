import type { Prisma } from '@/prisma/client';

import { z } from 'zod';
import { InvoiceStatusSchema } from './InvoiceStatusSchema';
import { NestedEnumInvoiceStatusFilterSchema } from './NestedEnumInvoiceStatusFilterSchema';

export const EnumInvoiceStatusFilterSchema: z.ZodType<Prisma.EnumInvoiceStatusFilter> = z.strictObject({
  equals: z.lazy(() => InvoiceStatusSchema).optional(),
  in: z.lazy(() => InvoiceStatusSchema).array().optional(),
  notIn: z.lazy(() => InvoiceStatusSchema).array().optional(),
  not: z.union([ z.lazy(() => InvoiceStatusSchema), z.lazy(() => NestedEnumInvoiceStatusFilterSchema) ]).optional(),
});

export default EnumInvoiceStatusFilterSchema;
