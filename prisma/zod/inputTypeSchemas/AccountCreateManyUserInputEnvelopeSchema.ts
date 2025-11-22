import type { Prisma } from '@/prisma/client';

import { z } from 'zod';
import { AccountCreateManyUserInputSchema } from './AccountCreateManyUserInputSchema';

export const AccountCreateManyUserInputEnvelopeSchema: z.ZodType<Prisma.AccountCreateManyUserInputEnvelope> = z.strictObject({
  data: z.union([ z.lazy(() => AccountCreateManyUserInputSchema), z.lazy(() => AccountCreateManyUserInputSchema).array() ]),
  skipDuplicates: z.boolean().optional(),
});

export default AccountCreateManyUserInputEnvelopeSchema;
