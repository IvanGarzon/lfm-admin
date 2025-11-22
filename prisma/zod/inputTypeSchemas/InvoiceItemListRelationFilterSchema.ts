import type { Prisma } from '@/prisma/client';

import { z } from 'zod';
import { InvoiceItemWhereInputSchema } from './InvoiceItemWhereInputSchema';

export const InvoiceItemListRelationFilterSchema: z.ZodType<Prisma.InvoiceItemListRelationFilter> = z.strictObject({
  every: z.lazy(() => InvoiceItemWhereInputSchema).optional(),
  some: z.lazy(() => InvoiceItemWhereInputSchema).optional(),
  none: z.lazy(() => InvoiceItemWhereInputSchema).optional(),
});

export default InvoiceItemListRelationFilterSchema;
