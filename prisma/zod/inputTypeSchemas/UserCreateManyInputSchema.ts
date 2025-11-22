import type { Prisma } from '@/prisma/client';

import { z } from 'zod';

export const UserCreateManyInputSchema: z.ZodType<Prisma.UserCreateManyInput> = z.strictObject({
  id: z.cuid().optional(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string().optional().nullable(),
  emailVerified: z.coerce.date().optional().nullable(),
  avatarUrl: z.string().optional().nullable(),
  password: z.string().optional().nullable(),
});

export default UserCreateManyInputSchema;
