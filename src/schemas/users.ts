import { z } from 'zod';
import { UserRoleSchema } from '@/zod/schemas/enums/UserRole.schema';
import { UserStatusSchema } from '@/zod/schemas/enums/UserStatus.schema';
import { commonValidators, VALIDATION_LIMITS } from '@/lib/validation';

export const UpdateUserSchema = z.object({
  id: z.cuid({ error: 'Invalid user ID' }),
  firstName: commonValidators.name('First name'),
  lastName: commonValidators.name('Last name'),
  email: commonValidators.email(),
  phone: commonValidators.phoneOptional(),
  status: UserStatusSchema,
  isTwoFactorEnabled: z.boolean().optional(),
  username: z
    .string()
    .max(VALIDATION_LIMITS.USERNAME_MAX, 'Username is too long')
    .regex(
      /^[a-z0-9_.-]+$/,
      'Username may only contain lowercase letters, numbers, underscores, hyphens, and dots',
    )
    .nullable()
    .optional(),
  title: z.string().max(VALIDATION_LIMITS.TITLE_MAX, 'Title is too long').nullable().optional(),
  bio: z
    .string()
    .max(VALIDATION_LIMITS.BIO_MAX, `Bio must be ${VALIDATION_LIMITS.BIO_MAX} characters or fewer`)
    .nullable()
    .optional(),
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

const passwordField = z
  .string()
  .min(
    VALIDATION_LIMITS.PASSWORD_MIN,
    `Password must be at least ${VALIDATION_LIMITS.PASSWORD_MIN} characters`,
  )
  .max(VALIDATION_LIMITS.PASSWORD_MAX, 'Password is too long');

export const ChangePasswordSchema = z
  .object({
    userId: z.cuid({ error: 'Invalid user ID' }),
    currentPassword: z.string().optional(),
    newPassword: passwordField,
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const AdminResetPasswordSchema = z
  .object({
    userId: z.cuid({ error: 'Invalid user ID' }),
    newPassword: passwordField,
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type ChangePasswordInput = z.infer<typeof ChangePasswordSchema>;
export type AdminResetPasswordInput = z.infer<typeof AdminResetPasswordSchema>;

export const ResetPasswordSchema = z
  .object({
    newPassword: passwordField,
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>;

export const InviteUserSchema = z.object({
  email: commonValidators.email(),
  role: z.enum(['USER', 'MANAGER', 'ADMIN']).default('USER'),
});

export type InviteUserInput = z.infer<typeof InviteUserSchema>;
