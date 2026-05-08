'use server';

import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { handleActionError } from '@/lib/error-handler';
import { withSuperAdmin, SUPER_ADMIN_TENANT_COOKIE } from '@/lib/action-auth';
import { TenantRepository } from '@/repositories/tenant-repository';
import type { ActionResult } from '@/types/actions';

const tenantRepo = new TenantRepository(prisma);

export const switchActiveTenant = withSuperAdmin<string | null, void>(
  async (_session, tenantId) => {
    try {
      const cookieStore = await cookies();

      if (tenantId) {
        const tenant = await tenantRepo.findTenantById(tenantId);

        if (!tenant) {
          return { success: false, error: 'Tenant not found' };
        }

        cookieStore.set(SUPER_ADMIN_TENANT_COOKIE, tenantId, {
          httpOnly: true,
          sameSite: 'lax',
          maxAge: 60 * 60 * 8, // 8 hours
          path: '/'
        });
      } else {
        cookieStore.delete(SUPER_ADMIN_TENANT_COOKIE);
      }

      return { success: true, data: undefined };
    } catch (error) {
      return handleActionError(error, 'Failed to switch tenant');
    }
  }
);
