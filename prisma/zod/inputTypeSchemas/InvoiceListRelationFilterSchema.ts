import type { Prisma } from '@/prisma/client';

import { z } from 'zod';
import { InvoiceWhereInputSchema } from './InvoiceWhereInputSchema';

export const InvoiceListRelationFilterSchema: z.ZodType<Prisma.InvoiceListRelationFilter> = z.strictObject({
  every: z.lazy(() => InvoiceWhereInputSchema).optional(),
  some: z.lazy(() => InvoiceWhereInputSchema).optional(),
  none: z.lazy(() => InvoiceWhereInputSchema).optional(),
});

export default InvoiceListRelationFilterSchema;
