import type { Prisma } from '@/prisma/client';

import { z } from 'zod';
import { InvoiceItemCreateManyInvoiceInputSchema } from './InvoiceItemCreateManyInvoiceInputSchema';

export const InvoiceItemCreateManyInvoiceInputEnvelopeSchema: z.ZodType<Prisma.InvoiceItemCreateManyInvoiceInputEnvelope> = z.strictObject({
  data: z.union([ z.lazy(() => InvoiceItemCreateManyInvoiceInputSchema), z.lazy(() => InvoiceItemCreateManyInvoiceInputSchema).array() ]),
  skipDuplicates: z.boolean().optional(),
});

export default InvoiceItemCreateManyInvoiceInputEnvelopeSchema;
