'use server';

import { SearchParams } from 'nuqs/server';
import { prisma } from '@/lib/prisma';
import { UserRepository } from '@/repositories/user-repository';
import { handleActionError } from '@/lib/error-handler';
import { withTenantPermission } from '@/lib/action-auth';
import { AuditService } from '@/services/audit.service';
import { PasswordResetTokenRepository } from '@/repositories/password-reset-token-repository';
import type { UserPagination, UserDetail } from '@/features/users/types';
import type { AccessChange } from '@/features/users/types';
import { searchParamsCache } from '@/filters/users/users-filters';

const userRepo = new UserRepository(prisma);
const auditService = new AuditService();
const passwordResetTokenRepo = new PasswordResetTokenRepository(prisma);

/**
 * Retrieves a paginated, filtered list of users for the current tenant.
 */
export const getTenantUsers = withTenantPermission<SearchParams, UserPagination>(
  'canManageUsers',
  async (ctx, searchParams) => {
    try {
      const filters = searchParamsCache.parse(searchParams);
      const result = await userRepo.searchAndPaginateTenantUsers(filters, ctx.tenantId);
      return { success: true, data: result };
    } catch (error) {
      return handleActionError(error, 'Failed to fetch users');
    }
  },
);

/**
 * Retrieves a single user by ID for the current tenant.
 */
export const getTenantUserById = withTenantPermission<string, UserDetail>(
  'canManageUsers',
  async (ctx, id) => {
    try {
      const user = await userRepo.findTenantUserById(id, ctx.tenantId);
      if (!user) {
        return { success: false, error: 'User not found' };
      }
      return { success: true, data: user };
    } catch (error) {
      return handleActionError(error, 'Failed to fetch user');
    }
  },
);

/**
 * Validates a password reset token. Public — no auth required.
 * @param token - The token string from the reset link
 * @returns ActionResult with the associated user's email if valid
 */
export async function getPasswordResetToken(
  token: string,
): Promise<{ success: boolean; data?: { email: string }; error?: string }> {
  try {
    const record = await passwordResetTokenRepo.findValid(token);
    if (!record) {
      return { success: false, error: 'This reset link is invalid or has expired.' };
    }

    const user = await userRepo.getUserByIdWithSelect(record.userId, { email: true });
    if (!user?.email) {
      return { success: false, error: 'User not found.' };
    }

    return { success: true, data: { email: user.email } };
  } catch (error) {
    return handleActionError(error, 'Failed to validate reset token');
  }
}

/**
 * Retrieves the 10 most recent role change events for a tenant user.
 * @param id - The target user's ID
 * @returns ActionResult with an array of access change records
 */
export const getUserRoleChanges = withTenantPermission<string, AccessChange[]>(
  'canManageUsers',
  async (_ctx, id) => {
    try {
      const changes = await auditService.findRoleChangesForUser(id);
      return { success: true, data: changes };
    } catch (error) {
      return handleActionError(error, 'Failed to fetch access changes');
    }
  },
);
