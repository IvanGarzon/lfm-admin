import type { Prisma } from '@/prisma/client';

import { z } from 'zod';

export const AccountProviderProviderAccountIdCompoundUniqueInputSchema: z.ZodType<Prisma.AccountProviderProviderAccountIdCompoundUniqueInput> = z.strictObject({
  provider: z.string(),
  providerAccountId: z.string(),
});

export default AccountProviderProviderAccountIdCompoundUniqueInputSchema;
