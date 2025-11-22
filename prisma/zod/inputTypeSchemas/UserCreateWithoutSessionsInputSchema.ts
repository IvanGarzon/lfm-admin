import type { Prisma } from '@/prisma/client';

import { z } from 'zod';
import { AccountCreateNestedManyWithoutUserInputSchema } from './AccountCreateNestedManyWithoutUserInputSchema';

export const UserCreateWithoutSessionsInputSchema: z.ZodType<Prisma.UserCreateWithoutSessionsInput> = z.strictObject({
  id: z.cuid().optional(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string().optional().nullable(),
  emailVerified: z.coerce.date().optional().nullable(),
  avatarUrl: z.string().optional().nullable(),
  password: z.string().optional().nullable(),
  accounts: z.lazy(() => AccountCreateNestedManyWithoutUserInputSchema).optional(),
});

export default UserCreateWithoutSessionsInputSchema;
