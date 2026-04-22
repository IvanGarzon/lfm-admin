'use server';

import { SearchParams } from 'nuqs/server';
import { prisma } from '@/lib/prisma';
import { UserRepository } from '@/repositories/user-repository';
import { handleActionError } from '@/lib/error-handler';
import { withTenantPermission } from '@/lib/action-auth';
import type { UserPagination, UserDetail } from '@/features/users/types';
import { searchParamsCache } from '@/filters/users/users-filters';

const userRepo = new UserRepository(prisma);

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
