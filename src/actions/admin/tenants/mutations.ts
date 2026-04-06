'use server';

import { revalidatePath } from 'next/cache';
import { handleActionError } from '@/lib/error-handler';
import { prisma } from '@/lib/prisma';
import { withSuperAdmin } from '@/lib/action-auth';
import { TenantRepository } from '@/repositories/tenant-repository';
import type { Tenant } from '@/prisma/client';
import type { CreateTenantInput, UpdateTenantInput } from '@/features/admin/tenants/types';

const tenantRepo = new TenantRepository(prisma);

export const createTenant = withSuperAdmin<CreateTenantInput, Tenant>(async (_session, data) => {
  try {
    const tenant = await tenantRepo.createTenant(data);
    revalidatePath('/admin/tenants');
    return { success: true, data: tenant };
  } catch (error) {
    return handleActionError(error, 'Failed to create tenant');
  }
});

export const updateTenant = withSuperAdmin<{ id: string } & UpdateTenantInput, Tenant>(
  async (_session, { id, ...data }) => {
    try {
      const tenant = await tenantRepo.updateTenant(id, data);
      revalidatePath('/admin/tenants');
      revalidatePath(`/admin/tenants/${id}`);
      return { success: true, data: tenant };
    } catch (error) {
      return handleActionError(error, 'Failed to update tenant');
    }
  },
);

export const suspendTenant = withSuperAdmin<string, Tenant>(async (_session, id) => {
  try {
    const tenant = await tenantRepo.suspendTenant(id);
    revalidatePath('/admin/tenants');
    revalidatePath(`/admin/tenants/${id}`);
    return { success: true, data: tenant };
  } catch (error) {
    return handleActionError(error, 'Failed to suspend tenant');
  }
});

export const activateTenant = withSuperAdmin<string, Tenant>(async (_session, id) => {
  try {
    const tenant = await tenantRepo.activateTenant(id);
    revalidatePath('/admin/tenants');
    revalidatePath(`/admin/tenants/${id}`);
    return { success: true, data: tenant };
  } catch (error) {
    return handleActionError(error, 'Failed to activate tenant');
  }
});
