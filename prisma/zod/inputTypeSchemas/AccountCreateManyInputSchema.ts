import type { Prisma } from '@/prisma/client';

import { z } from 'zod';

export const AccountCreateManyInputSchema: z.ZodType<Prisma.AccountCreateManyInput> = z.strictObject({
  id: z.cuid().optional(),
  userId: z.string(),
  type: z.string(),
  provider: z.string(),
  providerAccountId: z.string(),
  refreshToken: z.string().optional().nullable(),
  accessToken: z.string().optional().nullable(),
  expiresAt: z.number().int().optional().nullable(),
  tokenType: z.string().optional().nullable(),
  scope: z.string().optional().nullable(),
  idToken: z.string().optional().nullable(),
  sessionState: z.string().optional().nullable(),
});

export default AccountCreateManyInputSchema;
