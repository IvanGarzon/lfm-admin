'use server';

import { revalidatePath } from 'next/cache';
import { handleActionError } from '@/lib/error-handler';
import { withSuperAdmin } from '@/lib/action-auth';
import { userRepo } from '@/repositories/user-repository';
import type { User, UserRole } from '@/prisma/client';

export const updateUserRole = withSuperAdmin<{ id: string; role: UserRole }, User>(
  async (_session, { id, role }) => {
    try {
      const user = await userRepo.updateRole(id, role);
      revalidatePath('/admin/users');
      return { success: true, data: user };
    } catch (error) {
      return handleActionError(error, 'Failed to update user role');
    }
  },
);

export const reassignUserTenant = withSuperAdmin<{ id: string; tenantId: string }, User>(
  async (_session, { id, tenantId }) => {
    try {
      const user = await userRepo.reassignTenant(id, tenantId);
      revalidatePath('/admin/users');
      return { success: true, data: user };
    } catch (error) {
      return handleActionError(error, 'Failed to reassign user tenant');
    }
  },
);
