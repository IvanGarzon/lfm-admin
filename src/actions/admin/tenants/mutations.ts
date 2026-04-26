'use server';

import { revalidatePath } from 'next/cache';
import { handleActionError } from '@/lib/error-handler';
import { prisma } from '@/lib/prisma';
import { withSuperAdmin } from '@/lib/action-auth';
import { sendEmailNotification } from '@/lib/email-service';
import { absoluteUrl } from '@/lib/utils';
import { VALIDATION_LIMITS } from '@/lib/validation';
import { TenantRepository } from '@/repositories/tenant-repository';
import { InvitationRepository } from '@/repositories/invitation-repository';
import { UserRepository } from '@/repositories/user-repository';
import { UserRoleSchema } from '@/zod/schemas/enums/UserRole.schema';
import {
  CreateTenantSchema,
  UpdateTenantSchema,
  type CreateTenantInput,
  type UpdateTenantInput,
} from '@/schemas/tenants';
import type { Tenant } from '@/features/admin/tenants/types';

const tenantRepo = new TenantRepository(prisma);
const invitationRepo = new InvitationRepository(prisma);
const userRepo = new UserRepository(prisma);

/**
 * Creates a new tenant and dispatches an invitation to the specified admin user.
 */
export const createTenant = withSuperAdmin<CreateTenantInput, Tenant>(async (ctx, data) => {
  try {
    const { name, slug, adminEmail } = CreateTenantSchema.parse(data);

    const tenant = await tenantRepo.createTenant({ name, slug, adminEmail });
    const expiresAt = new Date(Date.now() + VALIDATION_LIMITS.INVITATION_EXPIRY_MS);

    const [invitation, inviter] = await Promise.all([
      invitationRepo.create({
        email: adminEmail,
        role: UserRoleSchema.enum.ADMIN,
        tenantId: tenant.id,
        invitedBy: ctx.user.id,
        expiresAt,
      }),
      userRepo.findById(ctx.user.id),
    ]);

    if (inviter) {
      await sendEmailNotification({
        to: adminEmail,
        subject: `You've been invited to join ${tenant.name}`,
        template: 'invitation',
        props: {
          inviterName: `${inviter.firstName} ${inviter.lastName}`,
          tenantName: tenant.name,
          role: invitation.role,
          acceptUrl: absoluteUrl(`/invite/accept?token=${invitation.token}`),
          expiresAt: invitation.expiresAt,
        },
      });
    }

    revalidatePath('/admin/tenants');
    return { success: true, data: tenant };
  } catch (error) {
    return handleActionError(error, 'Failed to create tenant');
  }
});

/**
 * Updates top-level tenant fields (name, slug).
 */
export const updateTenant = withSuperAdmin<{ id: string } & UpdateTenantInput, Tenant>(
  async (_ctx, { id, ...data }) => {
    try {
      const validated = UpdateTenantSchema.parse(data);
      const tenant = await tenantRepo.updateTenant(id, validated);
      revalidatePath('/admin/tenants');
      revalidatePath(`/admin/tenants/${id}`);
      return { success: true, data: tenant };
    } catch (error) {
      return handleActionError(error, 'Failed to update tenant');
    }
  },
);

/**
 * Suspends a tenant, preventing its users from accessing the system.
 */
export const suspendTenant = withSuperAdmin<string, Tenant>(async (_ctx, id) => {
  try {
    const tenant = await tenantRepo.suspendTenant(id);
    revalidatePath('/admin/tenants');
    revalidatePath(`/admin/tenants/${id}`);
    return { success: true, data: tenant };
  } catch (error) {
    return handleActionError(error, 'Failed to suspend tenant');
  }
});

/**
 * Re-activates a previously suspended tenant.
 */
export const activateTenant = withSuperAdmin<string, Tenant>(async (_ctx, id) => {
  try {
    const tenant = await tenantRepo.activateTenant(id);
    revalidatePath('/admin/tenants');
    revalidatePath(`/admin/tenants/${id}`);
    return { success: true, data: tenant };
  } catch (error) {
    return handleActionError(error, 'Failed to activate tenant');
  }
});
