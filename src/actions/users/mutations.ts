'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { UserRepository } from '@/repositories/user-repository';
import { handleActionError } from '@/lib/error-handler';
import { withTenantPermission, withAuth } from '@/lib/action-auth';
import { AuditService } from '@/services/audit.service';
import { InvitationRepository } from '@/repositories/invitation-repository';
import { TenantRepository } from '@/repositories/tenant-repository';
import { sendEmailNotification } from '@/lib/email-service';
import { absoluteUrl } from '@/lib/utils';
import { VALIDATION_LIMITS } from '@/lib/validation';
import {
  UpdateUserSchema,
  UpdateUserSecuritySchema,
  UpdateUserRoleSchema,
  SoftDeleteUserSchema,
  InviteUserSchema,
  ChangePasswordSchema,
  type UpdateUserInput,
  type UpdateUserSecurityInput,
  type UpdateUserRoleInput,
  type SoftDeleteUserInput,
  type InviteUserInput,
  type ChangePasswordInput,
} from '@/schemas/users';
import bcrypt from 'bcryptjs';
import { PasswordResetTokenRepository } from '@/repositories/password-reset-token-repository';
import { uploadFileToS3 } from '@/lib/s3';
import { ALLOWED_IMAGE_MIME_TYPES } from '@/lib/file-constants';
import type { UserDetail } from '@/features/users/types';
import type { User } from '@/prisma/client';

const userRepo = new UserRepository(prisma);
const invitationRepo = new InvitationRepository(prisma);
const tenantRepo = new TenantRepository(prisma);
const auditService = new AuditService();
const passwordResetTokenRepo = new PasswordResetTokenRepository(prisma);

/**
 * Updates editable fields (name, email, phone, status, 2FA) for a tenant user.
 */
export const updateUser = withTenantPermission<UpdateUserInput, UserDetail>(
  'canManageUsers',
  async (ctx, data) => {
    try {
      const { id, ...rest } = UpdateUserSchema.parse(data);
      const fields = { ...rest };
      const existing = await userRepo.findTenantUserById(id, ctx.tenantId);
      if (!existing) {
        return { success: false, error: 'User not found' };
      }

      const user = await userRepo.updateTenantUser(id, ctx.tenantId, fields);

      return { success: true, data: user };
    } catch (error) {
      return handleActionError(error, 'Failed to update user');
    }
  },
);

/**
 * Updates security settings (2FA, login notifications) for a tenant user.
 */
export const updateUserSecurity = withTenantPermission<UpdateUserSecurityInput, UserDetail>(
  'canManageUsers',
  async (ctx, data) => {
    try {
      const { id, ...fields } = UpdateUserSecuritySchema.parse(data);
      const existing = await userRepo.findTenantUserById(id, ctx.tenantId);
      if (!existing) {
        return { success: false, error: 'User not found' };
      }

      const user = await userRepo.updateUserSecurity(id, ctx.tenantId, fields);
      return { success: true, data: user };
    } catch (error) {
      return handleActionError(error, 'Failed to update security settings');
    }
  },
);

/**
 * Updates the role for a tenant user.
 */
export const updateUserRole = withTenantPermission<UpdateUserRoleInput, User>(
  'canManageUsers',
  async (ctx, data) => {
    try {
      const { id, role } = UpdateUserRoleSchema.parse(data);
      const existing = await userRepo.findTenantUserById(id, ctx.tenantId);
      if (!existing) {
        return { success: false, error: 'User not found' };
      }

      const user = await userRepo.updateTenantUserRole(id, ctx.tenantId, role);

      const changedByName =
        [ctx.user.firstName, ctx.user.lastName].filter(Boolean).join(' ') || 'Admin';
      auditService.UserRoleChanged({
        message: 'Role changed to ',
        data: {
          userId: ctx.userId,
          targetUserId: id,
          fromRole: existing.role,
          toRole: role,
          changedByName,
        },
      });

      return { success: true, data: user };
    } catch (error) {
      return handleActionError(error, 'Failed to update user role');
    }
  },
);

/**
 * Soft-deletes a tenant user by setting deletedAt.
 */
export const softDeleteUser = withTenantPermission<SoftDeleteUserInput, { id: string }>(
  'canManageUsers',
  async (ctx, data) => {
    try {
      const { id } = SoftDeleteUserSchema.parse(data);
      const deleted = await userRepo.softDeleteTenantUser(id, ctx.tenantId);
      if (!deleted) {
        return { success: false, error: 'User not found' };
      }

      revalidatePath('/users');

      return { success: true, data: { id } };
    } catch (error) {
      return handleActionError(error, 'Failed to delete user');
    }
  },
);

/**
 * Sends an invitation email to a new user to join the tenant.
 * @param data - Invitation input containing the recipient email and assigned role
 * @returns ActionResult with no data on success, or an error message on failure
 */
export const inviteUser = withTenantPermission<InviteUserInput, void>(
  'canManageUsers',
  async (ctx, data) => {
    try {
      const { email, role } = InviteUserSchema.parse(data);

      const existingUser = await userRepo.getUserByEmail(email);
      if (existingUser && existingUser.tenantId === ctx.tenantId) {
        return { success: false, error: 'A user with this email already exists' };
      }

      const existing = await invitationRepo.findPendingByEmail(email, ctx.tenantId);
      if (existing) {
        return { success: false, error: 'An invitation is already pending for this email' };
      }

      const [tenant, inviter] = await Promise.all([
        tenantRepo.findTenantById(ctx.tenantId),
        userRepo.findById(ctx.userId),
      ]);

      if (!tenant || !inviter) {
        return { success: false, error: 'Failed to load invitation context' };
      }

      const expiresAt = new Date(Date.now() + VALIDATION_LIMITS.INVITATION_EXPIRY_MS);

      const invitation = await invitationRepo.create({
        email,
        role,
        tenantId: ctx.tenantId,
        invitedBy: ctx.userId,
        expiresAt,
      });

      try {
        await sendEmailNotification({
          to: email,
          subject: `You've been invited to join ${tenant.name}`,
          template: 'invitation',
          props: {
            inviterName: `${inviter.firstName} ${inviter.lastName}`,
            tenantName: tenant.name,
            role: invitation.role,
            acceptUrl: absoluteUrl(`/invite/accept?token=${invitation.token}`),
            expiresAt: invitation.expiresAt,
          },
        });
      } catch (emailError) {
        await invitationRepo.revoke(invitation.id);
        return handleActionError(emailError, 'Failed to send invitation');
      }

      revalidatePath('/users');
      return { success: true, data: undefined };
    } catch (error) {
      return handleActionError(error, 'Failed to send invitation');
    }
  },
);

/**
 * Allows the current user to change their own password.
 * Requires the current password for verification.
 */
export const changePassword = withAuth<ChangePasswordInput, void>(async (session, data) => {
  try {
    const { userId, currentPassword, newPassword } = ChangePasswordSchema.parse(data);

    if (session.user.id !== userId) {
      return { success: false, error: 'Unauthorised' };
    }

    const user = await userRepo.getUserByIdWithSelect(userId, { id: true, password: true });
    if (!user) {
      return { success: false, error: 'User not found' };
    }

    if (!user.password) {
      return { success: false, error: 'No password set on this account' };
    }

    if (!currentPassword) {
      return { success: false, error: 'Current password is required' };
    }

    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) {
      return { success: false, error: 'Current password is incorrect' };
    }

    const hashed = await bcrypt.hash(newPassword, 12);
    await userRepo.updatePassword(userId, hashed);

    return { success: true, data: undefined };
  } catch (error) {
    return handleActionError(error, 'Failed to change password');
  }
});

/**
 * Sends a password reset email to a user. Admin-triggered.
 * Creates a single-use token and emails the user a link to set their own password.
 */
export const sendPasswordResetEmail = withTenantPermission<string, void>(
  'canManageUsers',
  async (ctx, userId) => {
    try {
      const [targetUser, requester] = await Promise.all([
        userRepo.findTenantUserById(userId, ctx.tenantId),
        userRepo.findById(ctx.userId),
      ]);

      if (!targetUser || !targetUser.email) {
        return { success: false, error: 'User not found or has no email address' };
      }

      if (!requester) {
        return { success: false, error: 'Requester not found' };
      }

      const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours
      const resetToken = await passwordResetTokenRepo.create(userId, ctx.userId, expiresAt);

      const requesterName =
        [requester.firstName, requester.lastName].filter(Boolean).join(' ') || 'Admin';

      await sendEmailNotification({
        to: targetUser.email,
        subject: 'Reset your password',
        template: 'password-reset',
        props: {
          userName: [targetUser.firstName, targetUser.lastName].filter(Boolean).join(' '),
          requestedByName: requesterName,
          resetUrl: absoluteUrl(`/reset-password?token=${resetToken.token}`),
          expiresAt,
        },
      });

      return { success: true, data: undefined };
    } catch (error) {
      return handleActionError(error, 'Failed to send password reset email');
    }
  },
);

/**
 * Completes a password reset using a valid token. Public — no auth required.
 * Validates the token, updates the password, and invalidates all other reset tokens.
 */
export async function resetPassword(
  token: string,
  newPassword: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const record = await passwordResetTokenRepo.findValid(token);
    if (!record) {
      return { success: false, error: 'This reset link is invalid or has expired.' };
    }

    const hashed = await bcrypt.hash(newPassword, 12);

    await Promise.all([
      userRepo.updatePassword(record.userId, hashed),
      passwordResetTokenRepo.invalidateAllForUser(record.userId),
    ]);

    return { success: true };
  } catch (error) {
    return handleActionError(error, 'Failed to reset password');
  }
}

/**
 * Uploads a new avatar image for a tenant user and saves the S3 URL.
 * Expects FormData with fields: `userId` (string) and `file` (File, image only).
 */
export const uploadUserAvatar = withTenantPermission<FormData, { avatarUrl: string }>(
  'canManageUsers',
  async (ctx, formData) => {
    try {
      const userId = formData.get('userId');
      const fileEntry = formData.get('file');

      if (typeof userId !== 'string' || !userId) {
        return { success: false, error: 'No userId provided' };
      }

      if (!(fileEntry instanceof File)) {
        return { success: false, error: 'No file provided' };
      }

      if (
        !ALLOWED_IMAGE_MIME_TYPES.includes(
          fileEntry.type as (typeof ALLOWED_IMAGE_MIME_TYPES)[number],
        )
      ) {
        return { success: false, error: 'Only image files are allowed' };
      }

      const existing = await userRepo.findTenantUserById(userId, ctx.tenantId);
      if (!existing) {
        return { success: false, error: 'User not found' };
      }

      const bytes = await fileEntry.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const { s3Url } = await uploadFileToS3({
        file: buffer,
        fileName: fileEntry.name,
        mimeType: fileEntry.type,
        resourceType: 'users',
        resourceId: userId,
        subPath: 'avatar',
        allowedMimeTypes: ALLOWED_IMAGE_MIME_TYPES,
      });

      await userRepo.updateUserAvatar(userId, ctx.tenantId, s3Url);

      return { success: true, data: { avatarUrl: s3Url } };
    } catch (error) {
      return handleActionError(error, 'Failed to upload avatar');
    }
  },
);
