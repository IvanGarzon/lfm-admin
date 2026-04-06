'use server';

import { handleActionError } from '@/lib/error-handler';
import { withSuperAdmin } from '@/lib/action-auth';
import { prisma } from '@/lib/prisma';
import { TenantRepository } from '@/repositories/tenant-repository';
import { userRepo } from '@/repositories/user-repository';
import type { TenantListItem, TenantWithSettings } from '@/features/admin/tenants/types';
import type { UserListItem } from '@/features/admin/users/types';

const tenantRepo = new TenantRepository(prisma);

export const getAdminTenants = withSuperAdmin<void, TenantListItem[]>(async (_session) => {
  try {
    const tenants = await tenantRepo.findAll();
    return { success: true, data: tenants };
  } catch (error) {
    return handleActionError(error, 'Failed to fetch tenants');
  }
});

export const getAdminTenantById = withSuperAdmin<
  string,
  { tenant: TenantWithSettings; users: UserListItem[] }
>(async (_session, id) => {
  try {
    const [tenant, users] = await Promise.all([
      tenantRepo.findTenantById(id),
      userRepo.findByTenant(id),
    ]);

    if (!tenant) {
      return { success: false, error: 'Tenant not found' };
    }

    return { success: true, data: { tenant, users } };
  } catch (error) {
    return handleActionError(error, 'Failed to fetch tenant');
  }
});
