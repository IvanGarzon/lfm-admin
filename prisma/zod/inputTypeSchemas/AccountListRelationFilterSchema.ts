import type { Prisma } from '@/prisma/client';

import { z } from 'zod';
import { AccountWhereInputSchema } from './AccountWhereInputSchema';

export const AccountListRelationFilterSchema: z.ZodType<Prisma.AccountListRelationFilter> = z.strictObject({
  every: z.lazy(() => AccountWhereInputSchema).optional(),
  some: z.lazy(() => AccountWhereInputSchema).optional(),
  none: z.lazy(() => AccountWhereInputSchema).optional(),
});

export default AccountListRelationFilterSchema;
