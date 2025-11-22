import type { Prisma } from '@/prisma/client';

import { z } from 'zod';
import { InvoiceItemCreateManyProductInputSchema } from './InvoiceItemCreateManyProductInputSchema';

export const InvoiceItemCreateManyProductInputEnvelopeSchema: z.ZodType<Prisma.InvoiceItemCreateManyProductInputEnvelope> = z.strictObject({
  data: z.union([ z.lazy(() => InvoiceItemCreateManyProductInputSchema), z.lazy(() => InvoiceItemCreateManyProductInputSchema).array() ]),
  skipDuplicates: z.boolean().optional(),
});

export default InvoiceItemCreateManyProductInputEnvelopeSchema;
