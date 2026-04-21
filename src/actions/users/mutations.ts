'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { UserRepository } from '@/repositories/user-repository';
import { handleActionError } from '@/lib/error-handler';
import { withTenantPermission } from '@/lib/action-auth';
import {
  UpdateUserSchema,
  UpdateUserRoleSchema,
  SoftDeleteUserSchema,
  type UpdateUserInput,
  type UpdateUserRoleInput,
  type SoftDeleteUserInput,
} from '@/schemas/users';
import type { UserDetail } from '@/features/users/types';
import type { User } from '@/prisma/client';

const userRepo = new UserRepository(prisma);

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
