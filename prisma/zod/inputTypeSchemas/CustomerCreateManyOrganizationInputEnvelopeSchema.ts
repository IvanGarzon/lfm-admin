import type { Prisma } from '@/prisma/client';

import { z } from 'zod';
import { CustomerCreateManyOrganizationInputSchema } from './CustomerCreateManyOrganizationInputSchema';

export const CustomerCreateManyOrganizationInputEnvelopeSchema: z.ZodType<Prisma.CustomerCreateManyOrganizationInputEnvelope> = z.strictObject({
  data: z.union([ z.lazy(() => CustomerCreateManyOrganizationInputSchema), z.lazy(() => CustomerCreateManyOrganizationInputSchema).array() ]),
  skipDuplicates: z.boolean().optional(),
});

export default CustomerCreateManyOrganizationInputEnvelopeSchema;
