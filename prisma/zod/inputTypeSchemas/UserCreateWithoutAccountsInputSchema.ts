import type { Prisma } from '@/prisma/client';

import { z } from 'zod';
import { SessionCreateNestedManyWithoutUserInputSchema } from './SessionCreateNestedManyWithoutUserInputSchema';

export const UserCreateWithoutAccountsInputSchema: z.ZodType<Prisma.UserCreateWithoutAccountsInput> = z.strictObject({
  id: z.cuid().optional(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string().optional().nullable(),
  emailVerified: z.coerce.date().optional().nullable(),
  avatarUrl: z.string().optional().nullable(),
  password: z.string().optional().nullable(),
  sessions: z.lazy(() => SessionCreateNestedManyWithoutUserInputSchema).optional(),
});

export default UserCreateWithoutAccountsInputSchema;
