'use server';

import { handleActionError } from '@/lib/error-handler';
import { withTenantPermission } from '@/lib/action-auth';
import { prisma } from '@/lib/prisma';
import { TenantRepository } from '@/repositories/tenant-repository';
import type { TenantWithSettings } from '@/features/admin/tenants/types';

const tenantRepo = new TenantRepository(prisma);

export const getTenantSettingsForAdmin = withTenantPermission<void, TenantWithSettings>(
  'canManageSettings',
  async (session) => {
    try {
      const tenant = await tenantRepo.findTenantById(session.user.tenantId);

      if (!tenant) {
        return { success: false, error: 'Tenant not found' };
      }

      return { success: true, data: tenant };
    } catch (error) {
      return handleActionError(error, 'Failed to fetch tenant settings');
    }
  },
);
