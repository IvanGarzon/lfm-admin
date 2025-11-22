import type { Prisma } from '@/prisma/client';

import { z } from 'zod';
import { SortOrderSchema } from './SortOrderSchema';

export const AccountAvgOrderByAggregateInputSchema: z.ZodType<Prisma.AccountAvgOrderByAggregateInput> = z.strictObject({
  expiresAt: z.lazy(() => SortOrderSchema).optional(),
});

export default AccountAvgOrderByAggregateInputSchema;
