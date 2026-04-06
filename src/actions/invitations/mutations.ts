'use server';

import { revalidatePath } from 'next/cache';
import { handleActionError } from '@/lib/error-handler';
import { prisma } from '@/lib/prisma';
import { withTenantPermission, withSuperAdmin } from '@/lib/action-auth';
import { invitationRepo } from '@/repositories/invitation-repository';
import { userRepo } from '@/repositories/user-repository';
import { TenantRepository } from '@/repositories/tenant-repository';
import { sendEmailNotification } from '@/lib/email-service';
import { absoluteUrl } from '@/lib/utils';
import { UserRole } from '@/prisma/client';

const tenantRepo = new TenantRepository(prisma);

const INVITATION_TTL_HOURS = 72;

// -- Shared email helper -----------------------------------------------------

async function dispatchInvitationEmail(
  inviterFirstName: string,
  inviterLastName: string,
  tenantName: string,
  role: UserRole,
  token: string,
  recipientEmail: string,
  expiresAt: Date,
): Promise<void> {
  const acceptUrl = absoluteUrl(`/invite/accept?token=${token}`);

  await sendEmailNotification({
    to: recipientEmail,
    subject: `You've been invited to join ${tenantName}`,
    template: 'invitation',
    props: {
      inviterName: `${inviterFirstName} ${inviterLastName}`,
      tenantName,
      role,
      acceptUrl,
      expiresAt,
    },
  });
}

// -- Tenant ADMIN: invite user to own tenant ----------------------------------

export const sendInvitation = withTenantPermission<{ email: string; role: UserRole }, void>(
  'canManageUsers',
  async (session, { email, role }) => {
    try {
      const existing = await invitationRepo.findPendingByEmail(email, session.user.tenantId);
      if (existing) {
        return { success: false, error: 'A pending invitation already exists for this email' };
      }

      const expiresAt = new Date(Date.now() + INVITATION_TTL_HOURS * 60 * 60 * 1000);

      const [invitation, tenant, inviter] = await Promise.all([
        invitationRepo.create({
          email,
          role,
          tenantId: session.user.tenantId,
          invitedBy: session.user.id,
          expiresAt,
        }),
        tenantRepo.findTenantById(session.user.tenantId),
        userRepo.findById(session.user.id),
      ]);

      if (!tenant || !inviter) {
        return { success: false, error: 'Failed to load invitation context' };
      }

      await dispatchInvitationEmail(
        inviter.firstName,
        inviter.lastName,
        tenant.name,
        invitation.role,
        invitation.token,
        email,
        invitation.expiresAt,
      );

      revalidatePath('/settings/tenant');
      return { success: true, data: undefined };
    } catch (error) {
      return handleActionError(error, 'Failed to send invitation');
    }
  },
);

export const revokeInvitation = withTenantPermission<string, void>(
  'canManageUsers',
  async (_session, id) => {
    try {
      await invitationRepo.revoke(id);
      revalidatePath('/settings/tenant');
      return { success: true, data: undefined };
    } catch (error) {
      return handleActionError(error, 'Failed to revoke invitation');
    }
  },
);

// -- SUPER_ADMIN: invite user to any tenant -----------------------------------

export const adminSendInvitation = withSuperAdmin<
  { email: string; role: UserRole; tenantId: string },
  void
>(async (session, { email, role, tenantId }) => {
  try {
    const existing = await invitationRepo.findPendingByEmail(email, tenantId);
    if (existing) {
      return { success: false, error: 'A pending invitation already exists for this email' };
    }

    const expiresAt = new Date(Date.now() + INVITATION_TTL_HOURS * 60 * 60 * 1000);

    const [invitation, tenant, inviter] = await Promise.all([
      invitationRepo.create({
        email,
        role,
        tenantId,
        invitedBy: session.user.id,
        expiresAt,
      }),
      tenantRepo.findById(tenantId),
      userRepo.findById(session.user.id),
    ]);

    if (!tenant || !inviter) {
      return { success: false, error: 'Failed to load invitation context' };
    }

    await dispatchInvitationEmail(
      inviter.firstName,
      inviter.lastName,
      tenant.name,
      invitation.role,
      invitation.token,
      email,
      invitation.expiresAt,
    );

    revalidatePath(`/admin/tenants/${tenantId}`);
    return { success: true, data: undefined };
  } catch (error) {
    return handleActionError(error, 'Failed to send invitation');
  }
});

export const adminRevokeInvitation = withSuperAdmin<string, void>(async (_session, id) => {
  try {
    await invitationRepo.revoke(id);
    return { success: true, data: undefined };
  } catch (error) {
    return handleActionError(error, 'Failed to revoke invitation');
  }
});
