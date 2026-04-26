'use server';

import { revalidatePath } from 'next/cache';
import { handleActionError } from '@/lib/error-handler';
import { prisma } from '@/lib/prisma';
import { withTenantPermission } from '@/lib/action-auth';
import { TenantRepository } from '@/repositories/tenant-repository';
import { UpdateTenantSettingsSchema, type UpdateTenantSettingsInput } from '@/schemas/tenants';

const tenantRepo = new TenantRepository(prisma);

export const updateTenantSettings = withTenantPermission<UpdateTenantSettingsInput, void>(
  'canManageSettings',
  async (ctx, data) => {
    try {
      const validated = UpdateTenantSettingsSchema.parse(data);
      await tenantRepo.updateTenantSettings(ctx.tenantId, validated);
      revalidatePath('/settings/tenant');
      return { success: true, data: undefined };
    } catch (error) {
      return handleActionError(error, 'Failed to update tenant settings');
    }
  },
);
