import type { Prisma } from '@/prisma/client';

import { z } from 'zod';
import { AccountWhereUniqueInputSchema } from './AccountWhereUniqueInputSchema';
import { AccountUpdateWithoutUserInputSchema } from './AccountUpdateWithoutUserInputSchema';
import { AccountUncheckedUpdateWithoutUserInputSchema } from './AccountUncheckedUpdateWithoutUserInputSchema';

export const AccountUpdateWithWhereUniqueWithoutUserInputSchema: z.ZodType<Prisma.AccountUpdateWithWhereUniqueWithoutUserInput> = z.strictObject({
  where: z.lazy(() => AccountWhereUniqueInputSchema),
  data: z.union([ z.lazy(() => AccountUpdateWithoutUserInputSchema), z.lazy(() => AccountUncheckedUpdateWithoutUserInputSchema) ]),
});

export default AccountUpdateWithWhereUniqueWithoutUserInputSchema;
