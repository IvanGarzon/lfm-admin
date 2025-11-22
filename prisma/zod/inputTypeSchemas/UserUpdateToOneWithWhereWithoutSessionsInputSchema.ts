import type { Prisma } from '@/prisma/client';

import { z } from 'zod';
import { UserWhereInputSchema } from './UserWhereInputSchema';
import { UserUpdateWithoutSessionsInputSchema } from './UserUpdateWithoutSessionsInputSchema';
import { UserUncheckedUpdateWithoutSessionsInputSchema } from './UserUncheckedUpdateWithoutSessionsInputSchema';

export const UserUpdateToOneWithWhereWithoutSessionsInputSchema: z.ZodType<Prisma.UserUpdateToOneWithWhereWithoutSessionsInput> = z.strictObject({
  where: z.lazy(() => UserWhereInputSchema).optional(),
  data: z.union([ z.lazy(() => UserUpdateWithoutSessionsInputSchema), z.lazy(() => UserUncheckedUpdateWithoutSessionsInputSchema) ]),
});

export default UserUpdateToOneWithWhereWithoutSessionsInputSchema;
