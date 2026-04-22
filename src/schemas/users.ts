import { z } from 'zod';
import { UserRoleSchema } from '@/zod/schemas/enums/UserRole.schema';
import { UserStatusSchema } from '@/zod/schemas/enums/UserStatus.schema';
import { commonValidators } from '@/lib/validation';

export const UpdateUserSchema = z.object({
  id: z.cuid({ error: 'Invalid user ID' }),
  firstName: commonValidators.name('First name'),
  lastName: commonValidators.name('Last name'),
  email: commonValidators.email(),
  phone: commonValidators.phoneOptional(),
  status: UserStatusSchema,
  isTwoFactorEnabled: z.boolean(),
});

export const UpdateUserRoleSchema = z.object({
  id: z.cuid({ error: 'Invalid user ID' }),
  role: UserRoleSchema,
});

export const SoftDeleteUserSchema = z.object({
  id: z.cuid({ error: 'Invalid user ID' }),
});

export type UpdateUserInput = z.infer<typeof UpdateUserSchema>;
export type UpdateUserRoleInput = z.infer<typeof UpdateUserRoleSchema>;
export type SoftDeleteUserInput = z.infer<typeof SoftDeleteUserSchema>;

export const InviteUserSchema = z.object({
  email: commonValidators.email(),
  role: z.enum(['USER', 'MANAGER', 'ADMIN']).default('USER'),
});

export type InviteUserInput = z.infer<typeof InviteUserSchema>;
