'use server';

import { handleActionError } from '@/lib/error-handler';
import { withSuperAdmin } from '@/lib/action-auth';
import { userRepo } from '@/repositories/user-repository';
import type { UserListItem } from '@/features/admin/users/types';

export const getAdminAllUsers = withSuperAdmin<void, UserListItem[]>(async (_session) => {
  try {
    const users = await userRepo.findAllWithTenant();
    return { success: true, data: users };
  } catch (error) {
    return handleActionError(error, 'Failed to fetch users');
  }
});
