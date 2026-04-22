'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { UserRepository } from '@/repositories/user-repository';
import { handleActionError } from '@/lib/error-handler';
import { withTenantPermission } from '@/lib/action-auth';
import { InvitationRepository } from '@/repositories/invitation-repository';
import { TenantRepository } from '@/repositories/tenant-repository';
import { sendEmailNotification } from '@/lib/email-service';
import { absoluteUrl } from '@/lib/utils';
import {
  UpdateUserSchema,
  UpdateUserRoleSchema,
  SoftDeleteUserSchema,
  InviteUserSchema,
  type UpdateUserInput,
  type UpdateUserRoleInput,
  type SoftDeleteUserInput,
  type InviteUserInput,
} from '@/schemas/users';
import type { UserDetail } from '@/features/users/types';
import type { User } from '@/prisma/client';

const userRepo = new UserRepository(prisma);
const invitationRepo = new InvitationRepository(prisma);
const tenantRepo = new TenantRepository(prisma);

/**
 * Updates editable fields (name, email, phone, status, 2FA) for a tenant user.
 */
export const updateUser = withTenantPermission<UpdateUserInput, UserDetail>(
  'canManageUsers',
  async (ctx, data) => {
    try {
      const { id, ...fields } = UpdateUserSchema.parse(data);
      const existing = await userRepo.findTenantUserById(id, ctx.tenantId);
      if (!existing) {
        return { success: false, error: 'User not found' };
      }

      const user = await userRepo.updateTenantUser(id, ctx.tenantId, fields);

      revalidatePath('/users');
      revalidatePath(`/users/${id}`);

      return { success: true, data: user };
    } catch (error) {
      return handleActionError(error, 'Failed to update user');
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

      revalidatePath('/users');
      revalidatePath(`/users/${id}`);

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

      const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000);

      const [invitation, tenant, inviter] = await Promise.all([
        invitationRepo.create({
          email,
          role,
          tenantId: ctx.tenantId,
          invitedBy: ctx.userId,
          expiresAt,
        }),
        tenantRepo.findTenantById(ctx.tenantId),
        userRepo.findById(ctx.userId),
      ]);

      if (!tenant || !inviter) {
        return { success: false, error: 'Failed to load invitation context' };
      }

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

      revalidatePath('/users');
      return { success: true, data: undefined };
    } catch (error) {
      return handleActionError(error, 'Failed to send invitation');
    }
  },
);
