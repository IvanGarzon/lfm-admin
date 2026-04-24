'use server';

import { handleActionError } from '@/lib/error-handler';
import { prisma } from '@/lib/prisma';
import { invitationRepo } from '@/repositories/invitation-repository';
import { UserRepository } from '@/repositories/user-repository';
import { TenantRepository } from '@/repositories/tenant-repository';
import { hashPassword } from '@/lib/password';
import { InvitationStatus, TenantStatus } from '@/prisma/client';
import type { InvitationWithTenant } from '@/features/admin/invitations/types';
import type { ActionResult } from '@/types/actions';

const userRepo = new UserRepository(prisma);
const tenantRepo = new TenantRepository(prisma);

export async function getInvitationByToken(
  token: string,
): Promise<ActionResult<InvitationWithTenant>> {
  try {
    const invitation = await invitationRepo.findByToken(token);

    if (!invitation) {
      return { success: false, error: 'Invitation not found or has expired' };
    }

    if (invitation.status === InvitationStatus.ACCEPTED) {
      return { success: false, error: 'This invitation has already been accepted' };
    }

    if (invitation.status === InvitationStatus.REVOKED) {
      return { success: false, error: 'This invitation has been revoked' };
    }

    if (invitation.status === InvitationStatus.EXPIRED || invitation.expiresAt < new Date()) {
      return { success: false, error: 'This invitation has expired' };
    }

    return { success: true, data: invitation };
  } catch (error) {
    return handleActionError(error, 'Failed to fetch invitation');
  }
}

export async function acceptInvitation(
  token: string,
  data: { firstName: string; lastName: string; password: string },
): Promise<ActionResult<{ tenantSlug: string }>> {
  try {
    const invitation = await invitationRepo.findByToken(token);

    if (!invitation) {
      return { success: false, error: 'Invitation not found' };
    }

    if (invitation.status !== InvitationStatus.PENDING) {
      return { success: false, error: 'Invitation is no longer valid' };
    }

    if (invitation.expiresAt < new Date()) {
      return { success: false, error: 'Invitation has expired' };
    }

    const hashedPassword = await hashPassword(data.password);

    const tenant = await tenantRepo.findTenantById(invitation.tenantId);

    await userRepo.createForTenant({
      firstName: data.firstName,
      lastName: data.lastName,
      email: invitation.email,
      role: invitation.role,
      tenantId: invitation.tenantId,
      password: hashedPassword,
    });

    await invitationRepo.accept(token);

    if (tenant?.status === TenantStatus.PENDING) {
      await tenantRepo.activateTenant(invitation.tenantId);
    }

    return { success: true, data: { tenantSlug: invitation.tenant.slug } };
  } catch (error) {
    return handleActionError(error, 'Failed to accept invitation');
  }
}
